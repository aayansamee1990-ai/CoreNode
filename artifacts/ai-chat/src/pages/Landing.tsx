import { Link } from "wouter";
import { Code, FunctionSquare, LayoutGrid, Sparkles, ArrowRight, Paperclip, Zap } from "lucide-react";

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

const FEATURES = [
  { Icon: LayoutGrid, label: "General", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { Icon: Code, label: "Coding", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  { Icon: FunctionSquare, label: "Math", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { Icon: Sparkles, label: "All-in-One", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-primary/20 blur-[120px] animate-float-slow" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-500/15 blur-[120px] animate-float-slower" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-sky-500/10 blur-[100px] animate-float-slow" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <div className="relative z-10 max-w-4xl w-full text-center">
        {/* Logo + badge */}
        <div className="flex flex-col items-center gap-5 mb-10">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/40 blur-xl" />
            <img
              src={`${baseUrl}/logo.svg`}
              alt="AayanSamee AI"
              className="relative h-16 w-16 rounded-2xl drop-shadow-2xl"
            />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 backdrop-blur-md px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Powered by Gemini 2.5 Flash
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
          <span className="text-foreground">AayanSamee</span>{" "}
          <span className="text-gradient">AI</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Your personal AI workbench. Chat, code, calculate, and create — with files, photos, and videos all in one place.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
          <Link
            href="/sign-in"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-[1.03] hover:shadow-primary/50 glow-primary"
          >
            Sign in with Google
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex h-12 items-center justify-center rounded-full border border-border/60 bg-card/40 backdrop-blur px-7 text-sm font-medium text-foreground transition-colors hover:bg-card/70"
          >
            Create account
          </Link>
        </div>

        {/* Feature row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
          {FEATURES.map(({ Icon, label, color, bg, border }) => (
            <div
              key={label}
              className={`flex flex-col items-center gap-2 rounded-2xl border ${border} ${bg} backdrop-blur-md py-4 px-3 transition-transform hover:-translate-y-0.5`}
            >
              <Icon className={`h-5 w-5 ${color}`} />
              <span className="text-xs font-medium text-foreground/90">{label}</span>
            </div>
          ))}
        </div>

        {/* Tiny capability hints */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground/80">
          <span className="inline-flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5" /> File uploads
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Streaming responses
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Vision &amp; audio
          </span>
        </div>
      </div>

      <div className="fixed bottom-5 right-5 z-50">
        <div className="px-3 py-1.5 bg-background/60 backdrop-blur-md border border-border/50 rounded-full text-[11px] font-medium text-muted-foreground shadow-sm">
          AayanSamee
        </div>
      </div>
    </div>
  );
}
