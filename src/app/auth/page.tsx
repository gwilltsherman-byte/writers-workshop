"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/contexts/auth";

export default function AuthPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  return (
    <AppShell>
      {/* Reuse the modal UI, but on this dedicated page */}
      <AuthModal
        onClose={() => router.push("/")}
        onAuth={async () => {
          await refresh();
          router.push("/");
        }}
      />
    </AppShell>
  );
}