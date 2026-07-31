/** Self-hosted story-face fonts (card / letter bake). Loaded on demand — not on the static landing. */

const STYLE_ID = "story-face-fonts";

const FACES = [
  {
    family: "EB Garamond",
    weight: "400",
    file: "/fonts/ebgaramond-400.woff2",
  },
  {
    family: "EB Garamond",
    weight: "500",
    file: "/fonts/ebgaramond-500.woff2",
  },
  {
    family: "Indie Flower",
    weight: "400",
    file: "/fonts/indieflower-400.woff2",
  },
];

let loadPromise;

function injectFontFaceStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = FACES.map(
    (face) => `@font-face {
  font-family: "${face.family}";
  font-style: normal;
  font-weight: ${face.weight};
  font-display: swap;
  src: url("${face.file}") format("woff2");
}`,
  ).join("\n");
  document.head.appendChild(style);
}

/** Ensure EB Garamond + Indie Flower are ready before HTML→texture bake. */
export function ensureStoryFonts() {
  if (typeof document === "undefined") return Promise.resolve();
  if (!loadPromise) {
    loadPromise = (async () => {
      injectFontFaceStyles();
      await Promise.all(
        FACES.map((face) =>
          document.fonts.load(`${face.weight} 16px "${face.family}"`).catch(() => undefined),
        ),
      );
      await document.fonts.ready.catch(() => undefined);
    })();
  }
  return loadPromise;
}
