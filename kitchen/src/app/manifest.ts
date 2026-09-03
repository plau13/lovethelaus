import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kitchen family recipes",
    short_name: "Kitchen",
    description: "Private family recipe box",
    start_url: "/recipes",
    display: "standalone",
    background_color: "#faf6f0",
    theme_color: "#faf6f0",
    icons: [
      {
        src: "/kitchen/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
