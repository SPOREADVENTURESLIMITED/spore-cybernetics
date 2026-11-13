import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "Spore Cybernetics", short_name: "Spore",
    description: "Spore Cybernetics — ICT and digital systems for businesses.",
    start_url: "/", scope: "/", display: "standalone",
    background_color: "#02091d", theme_color: "#061a48", orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
    ]
  };
}