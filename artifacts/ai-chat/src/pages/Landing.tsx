import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

      <div className="z-10 max-w-3xl px-6 text-center">
        <div className="mb-8 flex justify-center">
          <img src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/logo.svg`} alt="AayanSamee AI Logo" className="h-16 w-16 drop-shadow-sm" />
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6">
          AayanSamee <span className="text-primary">AI</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Your personal AI workbench. Designed for focus, engineered for clarity, tailored to you.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/sign-in" className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
            Sign in with Google
          </Link>
        </div>
      </div>
      
      <div className="fixed bottom-6 left-6 z-50">
        <div className="px-3 py-1.5 bg-background/60 backdrop-blur-md border border-border/50 rounded-full text-xs font-medium text-muted-foreground shadow-sm">
          AayanSamee
        </div>
      </div>
    </div>
  );
}
