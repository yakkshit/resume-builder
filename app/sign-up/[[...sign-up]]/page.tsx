import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isClerkConfigured } from "@/lib/auth/clerk-config";
import { Key, ArrowRight, ShieldCheck, Terminal, Sparkles } from "lucide-react";

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-lg border-border/80 shadow-2xl bg-card/80 backdrop-blur-md">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
              <Sparkles className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold">Clerk Sign Up</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              To activate Clerk authentication for app <code className="text-primary font-mono font-semibold">app_3IbkSkCeqVL00WPwqh87knU6oII</code>, pull your development keys:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/50 font-mono text-xs text-foreground/90 flex items-center justify-between">
              <span className="truncate">npx clerk@latest env pull --app app_3IbkSkCeqVL00WPwqh87knU6oII</span>
              <Terminal className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              Or copy your <strong className="text-foreground">Publishable Key</strong> and <strong className="text-foreground">Secret Key</strong> from <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">dashboard.clerk.com</a> into your <code className="text-foreground font-mono">.env</code> file.
            </div>
            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                <Link href="/">Back to Home</Link>
              </Button>
              <Button asChild size="sm" className="flex-1 text-xs font-semibold">
                <Link href="/chat">
                  <span>Enter Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md flex justify-center">
        <SignUp />
      </div>
    </div>
  );
}
