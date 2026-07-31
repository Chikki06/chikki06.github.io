import { toCanvas } from "html-to-image";
import { CanvasTexture, SRGBColorSpace } from "three";
import { ensureStoryFonts } from "./storyFonts.js";

/** Mark interactive elements with this attribute so bake can collect mesh hitboxes. */
export const BAKE_HITBOX_ATTR = "data-bake-hitbox";

/**
 * Measure `[data-bake-hitbox]` links inside a face root, in the face's local
 * CSS pixel coordinates (origin = top-left of `root`).
 */
export function collectBakeHitboxes(root) {
  if (!root) return [];
  const rootRect = root.getBoundingClientRect();
  return Array.from(root.querySelectorAll(`[${BAKE_HITBOX_ATTR}]`))
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left - rootRect.left,
        top: rect.top - rootRect.top,
        width: rect.width,
        height: rect.height,
        href: element.getAttribute("href") || element.dataset.href || "",
      };
    })
    .filter((box) => box.href && box.width > 0.5 && box.height > 0.5);
}

function waitForImages(root) {
  const images = Array.from(root.querySelectorAll("img"));
  return Promise.all(
    images.map((image) => {
      if (image.complete && image.naturalWidth > 0) return Promise.resolve();
      // Force a decode after load so html-to-image doesn't race an undecoded frame.
      return new Promise((resolve) => {
        const done = () => {
          if (typeof image.decode === "function") {
            image.decode().then(resolve, resolve);
          } else {
            resolve();
          }
        };
        image.addEventListener("load", done, { once: true });
        image.addEventListener("error", resolve, { once: true });
        // Cached-but-undecoded images: re-touch src so load/decode can settle.
        if (!image.complete && image.src) {
          const { src } = image;
          image.src = src;
        }
      });
    }),
  );
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Rasterize a laid-out HTML face into a Three.js CanvasTexture.
 *
 * Workflow: edit the HTML/Tailwind face → mount it (offscreen is fine) → call
 * this → apply the texture on a plane mesh that matches the face aspect.
 *
 * @param {HTMLElement} element Face root with fixed width/height.
 * @param {{ pixelRatio?: number }} [options]
 * @returns {Promise<{ texture: CanvasTexture, hitboxes: object[], design: { width: number, height: number } }>}
 */
export async function bakeHtmlFace(element, { pixelRatio = 2 } = {}) {
  if (!element) throw new Error("bakeHtmlFace requires a mounted HTML element");

  await ensureStoryFonts();
  await waitForImages(element);
  // Two frames so Tailwind layout / webfonts settle before capture.
  await nextFrame();
  await nextFrame();

  const width = Math.max(1, Math.round(element.offsetWidth));
  const height = Math.max(1, Math.round(element.offsetHeight));
  const hitboxes = collectBakeHitboxes(element);

  // Same-origin assets: cacheBust appends ?t=… and intermittently 404s/fails on Pages.
  const canvas = await toCanvas(element, {
    width,
    height,
    pixelRatio,
    backgroundColor: null,
    cacheBust: false,
    style: {
      transform: "none",
      // Capture at the authored size even if the host is scaled.
      width: `${width}px`,
      height: `${height}px`,
    },
  });

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  return {
    texture,
    hitboxes,
    design: { width, height },
  };
}

/** Map a CSS-pixel hitbox on a design face into local Three.js plane coords. */
export function designToLocal(design, meshSize, left, top, width, height) {
  return {
    x: ((left + width / 2) / design.width - 0.5) * meshSize.width,
    y: -((top + height / 2) / design.height - 0.5) * meshSize.height,
    width: (width / design.width) * meshSize.width,
    height: (height / design.height) * meshSize.height,
  };
}
