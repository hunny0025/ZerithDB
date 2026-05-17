import type { AstroIntegration } from "astro";

export default function zerithdb(): AstroIntegration {
  return {
    name: "zerithdb",
    hooks: {
      "astro:config:setup"() {
        console.log("ZerithDB Astro integration loaded");
      },
    },
  };
}
