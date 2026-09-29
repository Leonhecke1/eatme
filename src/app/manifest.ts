import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EatMe - veganer Ernährungsplaner",
    short_name: "EatMe",
    description: "Veganer Kalorien-Tracker und Ernährungsplaner mit Budget und Einkaufsliste.",
    start_url: "/heute",
    display: "standalone",
    background_color: "#f5faf6",
    theme_color: "#f5faf6",
    lang: "de",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
