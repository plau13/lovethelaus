import type { MetadataRoute } from "next";
import { appUrl, BASE_PATH } from "@/lib/paths";

/** Served at /kitchen/robots.txt. The marketing site's root robots.txt points crawlers at our sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [`${BASE_PATH}/explore`, `${BASE_PATH}/c/`, `${BASE_PATH}/r/`, `${BASE_PATH}/api/recipe-photos/`],
        disallow: [`${BASE_PATH}/`],
      },
    ],
    sitemap: appUrl("/sitemap.xml"),
  };
}
