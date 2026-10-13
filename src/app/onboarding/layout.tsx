import type { Metadata } from "next";

export const metadata: Metadata = { title: "Personalize your feed" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
