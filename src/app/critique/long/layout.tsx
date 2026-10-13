import type { Metadata } from "next";

export const metadata: Metadata = { title: "Slow critique" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
