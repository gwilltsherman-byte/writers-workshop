import "./globals.css";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "@/contexts/auth";
import { InstalledApp } from "@/components/InstalledApp";

const serif = localFont({
  src: [
    {
      path: "./fonts/literata-latin.woff2",
      style: "normal",
      weight: "200 900",
    },
    {
      path: "./fonts/literata-italic-latin.woff2",
      style: "italic",
      weight: "200 900",
    },
  ],
  variable: "--font-serif",
  display: "swap",
});
const mono = localFont({
  src: [
    {
      path: "./fonts/courier-prime-latin.woff2",
      style: "normal",
      weight: "400",
    },
    {
      path: "./fonts/courier-prime-bold-latin.woff2",
      style: "normal",
      weight: "700",
    },
  ],
  variable: "--font-mono",
  display: "swap",
});

function siteUrl() {
  try {
    return new URL(
      process.env.APP_BASE_URL || process.env.URL || "http://localhost:3000",
    );
  } catch {
    return new URL("http://localhost:3000");
  }
}

const description =
  "Write drafts, swap critiques with other writers, play timed writing games, and publish your work to a shared library.";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "Writers’ Workshop | Draft, critique, publish",
    template: "%s | Writers’ Workshop",
  },
  description,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Writers’ Workshop",
    statusBarStyle: "default",
  },
  icons: { apple: "/app-icons/icon-180.png" },
  openGraph: {
    type: "website",
    siteName: "Writers’ Workshop",
    title: "Writers’ Workshop",
    description,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f5f9" },
    { media: "(prefers-color-scheme: dark)", color: "#151c2d" },
  ],
};

// Set the theme class before paint to avoid a flash of the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem('ww-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AuthProvider>
          <InstalledApp />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
