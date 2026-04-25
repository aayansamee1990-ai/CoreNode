import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, conversations, messages, type MessageAttachment } from "@workspace/db";
import { ai } from "@workspace/integrations-gemini-ai";
import {
  CreateGeminiConversationBodySchema,
  GetGeminiConversationParams,
  UpdateGeminiConversationBodySchema,
  UpdateGeminiConversationParams,
  DeleteGeminiConversationParams,
  ListGeminiMessagesParams,
  SendGeminiMessageBodySchema,
  SendGeminiMessageParams,
} from "@workspace/api-zod";
import { ObjectStorageService } from "../../lib/objectStorage";

const objectStorageService = new ObjectStorageService();

async function attachmentToInlinePart(att: MessageAttachment) {
  const file = await objectStorageService.getObjectEntityFile(att.objectPath);
  const [buffer] = await file.download();
  return {
    inlineData: {
      mimeType: att.mimeType,
      data: buffer.toString("base64"),
    },
  };
}

const router: IRouter = Router();

interface AuthedRequest extends Request {
  userId?: string;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

const SYSTEM_PROMPTS: Record<string, string> = {
  coding:
    "You are an expert coding assistant. Be concise, accurate, and explain non-obvious tradeoffs. " +
    "Always prefer working code in fenced code blocks with the correct language tag. " +
    "When debugging, ask only for the smallest piece of context you actually need.",
  math:
    "You are an expert math tutor. Walk through problems step-by-step with clear reasoning. " +
    "Use LaTeX for math, wrapping inline math in single dollar signs and display math in double dollar signs " +
    "(e.g. $x^2$ inline, $$\\int_0^1 x\\,dx$$ display). Verify each step.",
  general:
    "You are a thoughtful general-purpose assistant. Be friendly, clear, and direct. " +
    "Cite uncertainty honestly. Keep answers focused and well-structured.",
  all:
    "You are an all-in-one assistant who can fluidly switch between coding help, math tutoring, and general questions. " +
    "Detect the user's intent for each turn. Use fenced code blocks with language tags for code, " +
    "and LaTeX (single $ for inline, double $$ for display) for math. Be concise and useful.",
};

function systemPromptFor(mode: string): string {
  return SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.general!;
}

router.get("/conversations", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const rows = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        mode: conversations.mode,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .where(eq(conversations.userId, req.userId!))
      .orderBy(desc(conversations.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "list conversations failed");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.post("/conversations", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = CreateGeminiConversationBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  try {
    const [row] = await db
      .insert(conversations)
      .values({
        userId: req.userId!,
        title: parsed.data.title.slice(0, 200) || "New chat",
        mode: parsed.data.mode,
      })
      .returning();
    res.status(201).json({
      id: row!.id,
      title: row!.title,
      mode: row!.mode,
      createdAt: row!.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "create conversation failed");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/conversations/:id", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = GetGeminiConversationParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const id = parsed.data.id;
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, req.userId!)))
      .limit(1);
    if (!conv) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt), asc(messages.id));
    res.json({
      id: conv.id,
      title: conv.title,
      mode: conv.mode,
      createdAt: conv.createdAt,
      messages: msgs.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        attachments: m.attachments ?? [],
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "get conversation failed");
    res.status(500).json({ error: "Failed to load conversation" });
  }
});

router.patch("/conversations/:id", requireAuth, async (req: AuthedRequest, res) => {
  const params = UpdateGeminiConversationParams.safeParse(req.params);
  const body = UpdateGeminiConversationBodySchema.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const updates: Partial<{ title: string; mode: string }> = {};
  if (body.data.title !== undefined) updates.title = body.data.title.slice(0, 200);
  if (body.data.mode !== undefined) updates.mode = body.data.mode;
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }
  try {
    const [row] = await db
      .update(conversations)
      .set(updates)
      .where(
        and(eq(conversations.id, params.data.id), eq(conversations.userId, req.userId!)),
      )
      .returning();
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({
      id: row.id,
      title: row.title,
      mode: row.mode,
      createdAt: row.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "update conversation failed");
    res.status(500).json({ error: "Failed to update conversation" });
  }
});

router.delete("/conversations/:id", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = DeleteGeminiConversationParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const result = await db
      .delete(conversations)
      .where(
        and(eq(conversations.id, parsed.data.id), eq(conversations.userId, req.userId!)),
      )
      .returning({ id: conversations.id });
    if (result.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "delete conversation failed");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

router.get("/conversations/:id/messages", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = ListGeminiMessagesParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [conv] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(eq(conversations.id, parsed.data.id), eq(conversations.userId, req.userId!)),
      )
      .limit(1);
    if (!conv) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, parsed.data.id))
      .orderBy(asc(messages.createdAt), asc(messages.id));
    res.json(
      msgs.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        attachments: m.attachments ?? [],
        createdAt: m.createdAt,
      })),
    );
  } catch (err) {
    req.log.error({ err }, "list messages failed");
    res.status(500).json({ error: "Failed to list messages" });
  }
});

router.post("/conversations/:id/messages", requireAuth, async (req: AuthedRequest, res) => {
  const params = SendGeminiMessageParams.safeParse(req.params);
  const body = SendGeminiMessageBodySchema.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const id = params.data.id;
  const userContent = body.data.content.trim();
  const attachments: MessageAttachment[] = (body.data.attachments ?? []) as MessageAttachment[];
  if (!userContent && attachments.length === 0) {
    res.status(400).json({ error: "Empty message" });
    return;
  }

  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, req.userId!)))
      .limit(1);
    if (!conv) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    await db.insert(messages).values({
      conversationId: id,
      role: "user",
      content: userContent,
      attachments,
    });

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt), asc(messages.id));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const systemPrompt = systemPromptFor(conv.mode);

    const contents = await Promise.all(
      history.map(async (m) => {
        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
        const msgAttachments = (m.attachments ?? []) as MessageAttachment[];
        for (const att of msgAttachments) {
          try {
            parts.push(await attachmentToInlinePart(att));
          } catch (err) {
            req.log.warn({ err, att }, "failed to load attachment");
          }
        }
        if (m.content) parts.push({ text: m.content });
        if (parts.length === 0) parts.push({ text: "" });
        return {
          role: m.role === "assistant" ? "model" : "user",
          parts,
        };
      }),
    );

    let fullResponse = "";
    try {
      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents,
        config: {
          maxOutputTokens: 8192,
          systemInstruction: systemPrompt,
        },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }
    } catch (err) {
      req.log.error({ err }, "gemini stream failed");
      res.write(
        `data: ${JSON.stringify({ error: "AI request failed. Please try again." })}\n\n`,
      );
    }

    if (fullResponse.length > 0) {
      await db.insert(messages).values({
        conversationId: id,
        role: "assistant",
        content: fullResponse,
      });
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "send message failed");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send message" });
    } else {
      res.end();
    }
  }
});

export default router;
