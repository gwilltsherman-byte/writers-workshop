import type { Metadata } from "next";

export const metadata: Metadata = { title: "The writing game" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
