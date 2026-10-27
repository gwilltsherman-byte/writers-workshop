import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "Writers’ Workshop", short_name: "Workshop",
    description: "Write drafts, exchange critiques, chat and play writing games.",
    start_url: "/editor", scope: "/", display: "standalone",
    background_color: "#f3f5f9", theme_color: "#f3f5f9",
    icons: [
      { src: "/app-icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
