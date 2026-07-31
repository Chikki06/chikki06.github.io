import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { bakeHtmlFace, designToLocal } from "../lib/bakeHtmlFace.js";

function setLinkCursor(active) {
  document.body.style.cursor = active ? "var(--cursor-red-pointer), pointer" : "";
}

function FaceHitbox({ design, meshSize, left, top, width, height, href, z }) {
  const local = designToLocal(design, meshSize, left, top, width, height);
  return (
    <mesh
      position={[local.x, local.y, z]}
      onClick={(event) => {
        event.stopPropagation();
        if (!href) return;
        if (href.startsWith("mailto:")) window.location.href = href;
        else window.open(href, "_blank", "noopener,noreferrer");
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setLinkCursor(true);
      }}
      onPointerOut={() => setLinkCursor(false)}
    >
      <planeGeometry args={[local.width, local.height]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/** DOM-only mount used by a separate React root (never inside the R3F tree). */
function BakeMount({ width, height, className, children, onReady }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (ref.current) onReady?.(ref.current);
  });
  return (
    <div ref={ref} className={className} style={{ width, height }}>
      {children}
    </div>
  );
}

/**
 * Renders `children` HTML via a detached ReactDOM root (not the R3F reconciler),
 * bakes it to a CanvasTexture, and draws a plane mesh + hitboxes.
 *
 * Important: do not portal HTML into the Canvas tree — R3F will treat `<p>` as a
 * Three object. Always mount faces with createRoot, as this component does.
 */
export default function BakedHtmlFace({
  designWidth,
  designHeight,
  meshWidth,
  meshHeight,
  z = 0,
  hitboxZ = 0.01,
  bakeKey = "",
  className = "",
  children,
}) {
  const textureRef = useRef(null);
  const childrenRef = useRef(children);
  childrenRef.current = children;

  const [{ host, root }] = useState(() => {
    if (typeof document === "undefined") return { host: null, root: null };
    const element = document.createElement("div");
    element.className = "bake-html-host";
    element.setAttribute("aria-hidden", "true");
    document.body.appendChild(element);
    return { host: element, root: createRoot(element) };
  });

  const [baked, setBaked] = useState({
    texture: null,
    hitboxes: [],
    design: { width: designWidth, height: designHeight },
  });

  useEffect(
    () => () => {
      root?.unmount();
      host?.remove();
      textureRef.current?.dispose();
      textureRef.current = null;
    },
    [host, root],
  );

  useLayoutEffect(() => {
    if (!root) return undefined;
    let cancelled = false;

    root.render(
      <BakeMount
        width={designWidth}
        height={designHeight}
        className={className}
        onReady={async (element) => {
          if (cancelled) return;
          try {
            const result = await bakeHtmlFace(element, { pixelRatio: 2 });
            if (cancelled) {
              result.texture.dispose();
              return;
            }
            if (textureRef.current && textureRef.current !== result.texture) {
              textureRef.current.dispose();
            }
            textureRef.current = result.texture;
            setBaked(result);
          } catch {
            // Bake can fail if the host unmounts mid-capture; ignore.
          }
        }}
      >
        {childrenRef.current}
      </BakeMount>,
    );

    return () => {
      cancelled = true;
    };
  }, [bakeKey, designWidth, designHeight, className, root]);

  const meshSize = { width: meshWidth, height: meshHeight };

  // Only R3F nodes here — never return DOM/`createPortal` from inside Canvas.
  return (
    <>
      {baked.texture && (
        <mesh position={[0, 0, z]} raycast={() => null}>
          <planeGeometry args={[meshWidth, meshHeight]} />
          <meshBasicMaterial map={baked.texture} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      )}
      {baked.hitboxes.map((box) => (
        <FaceHitbox
          key={`${box.href}-${box.left.toFixed(1)}-${box.top.toFixed(1)}`}
          design={baked.design}
          meshSize={meshSize}
          left={box.left}
          top={box.top}
          width={box.width}
          height={box.height}
          href={box.href}
          z={hitboxZ}
        />
      ))}
    </>
  );
}
