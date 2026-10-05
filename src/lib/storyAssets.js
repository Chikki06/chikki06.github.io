/** Shared desk / GLTF asset paths and drei preload helpers for the scroll story. */

export const PAPER = "/assets/card.webp";
export const ENVELOPE = "/assets/envelope.webp";
export const TABLE = "/assets/table.webp";
export const WALL = "/assets/wall.webp";
export const DESK_TEXTURES = [PAPER, ENVELOPE, TABLE, WALL];
export const MONITOR_GLTF = "/assets/monitor/scene.gltf";
export const POLAROID_GLTF = "/assets/polaroid/scene.gltf";
export const CAMERA_GLTF = "/assets/camera/scene.gltf";

/**
 * Desktop / laptop pointer + viewport heuristic.
 * Phones and most tablets stay on the static site without warming 3D assets.
 */
export function isDesktopLikeDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 900px)").matches;
}

/** Wait until imgs under `root` have settled (or timeout). Used so 3D assets don't steal bandwidth. */
export function whenImagesSettled(root, timeoutMs = 4500) {
  return new Promise((resolve) => {
    const imgs = root ? Array.from(root.querySelectorAll("img")) : [];
    if (!imgs.length) {
      resolve();
      return;
    }
    let pending = imgs.length;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      resolve();
    };
    const onOne = () => {
      pending -= 1;
      if (pending <= 0) finish();
    };
    const timer = window.setTimeout(finish, timeoutMs);
    for (const img of imgs) {
      if (img.complete) onOne();
      else {
        img.addEventListener("load", onOne, { once: true });
        img.addEventListener("error", onOne, { once: true });
      }
    }
  });
}

/**
 * Warm drei's loader cache for desk planes + GLTFs (camera.bin rides along with CAMERA_GLTF).
 * Lazy-imports drei so the static `/` route does not pull Three.js into the critical path.
 */
export async function preloadStoryAssets({ heavy = false } = {}) {
  const { useGLTF, useTexture } = await import("@react-three/drei");
  for (const src of DESK_TEXTURES) useTexture.preload(src);
  useGLTF.preload(MONITOR_GLTF);
  if (heavy) {
    useGLTF.preload(POLAROID_GLTF);
    useGLTF.preload(CAMERA_GLTF);
  }
}
