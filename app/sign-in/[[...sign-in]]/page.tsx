"use client";

import React, { Suspense } from "react";
import { FirebaseAuthCard } from "@/components/auth/firebase-auth-card";
import { Loader2 } from "lucide-react";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <FirebaseAuthCard initialMode="sign-in" />
    </Suspense>
  );
}
