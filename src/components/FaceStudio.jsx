import { useEffect, useMemo, useRef, useState } from "react";
import { useContent } from "../hooks/useContent.js";
import { createStoryData } from "./storyData.js";
import { bakeHtmlFace } from "../lib/bakeHtmlFace.js";
import BusinessCardFront from "./storyFaces/BusinessCardFront.jsx";
import BusinessCardBack from "./storyFaces/BusinessCardBack.jsx";
import LetterFace from "./storyFaces/LetterFace.jsx";

const FACES = [
  { id: "card-front", label: "Business card · front", width: 530, height: 300, Face: BusinessCardFront, propsFrom: (data) => ({ data }) },
  { id: "card-back", label: "Business card · back", width: 530, height: 300, Face: BusinessCardBack, propsFrom: (data) => ({ nodes: data.timeline }) },
  { id: "letter", label: "Contact letter", width: 510, height: 320, Face: LetterFace, propsFrom: (data) => ({ data }) },
];

/**
 * Dev-only HTML face studio. Edit components under `src/components/storyFaces/`,
 * preview the HTML here, and confirm the bake (texture) looks correct before the
 * 3D story uses `BakedHtmlFace` at runtime.
 */
export default function FaceStudio() {
  const { timeline, site } = useContent();
  const data = useMemo(() => createStoryData(timeline, site), [timeline, site]);
  const [activeId, setActiveId] = useState(FACES[0].id);
  const [previewUrl, setPreviewUrl] = useState("");
  const [status, setStatus] = useState("Mounting face…");
  const faceRef = useRef(null);
  const active = FACES.find((face) => face.id === activeId) || FACES[0];
  const Face = active.Face;

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    const run = async () => {
      setStatus("Baking…");
      setPreviewUrl("");
      const element = faceRef.current;
      if (!element) return;
      try {
        const { texture, hitboxes } = await bakeHtmlFace(element, { pixelRatio: 2 });
        if (cancelled) {
          texture.dispose();
          return;
        }
        const canvas = texture.image;
        objectUrl = canvas.toDataURL("image/png");
        texture.dispose();
        setPreviewUrl(objectUrl);
        setStatus(`Baked ${canvas.width}×${canvas.height} · ${hitboxes.length} hitbox${hitboxes.length === 1 ? "" : "es"}`);
      } catch (error) {
        if (!cancelled) setStatus(`Bake failed: ${error?.message || error}`);
      }
    };

    const timer = window.setTimeout(run, 50);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeId, data]);

  return (
    <div className="min-h-screen bg-[#1a1612] text-[#f3ebe0]">
      <header className="border-b border-white/10 px-6 py-5">
        <p className="font-mono text-[10px] uppercase tracking-[.22em] text-white/45">Dev tool · /faces</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-.03em]">Story face studio</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/65">
          Edit HTML under <code className="text-white/90">src/components/storyFaces/</code>. The 3D story bakes these
          faces to mesh textures via <code className="text-white/90">BakedHtmlFace</code> so they do not jitter against
          the scroll camera. Mark links with <code className="text-white/90">data-bake-hitbox</code>.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 px-6 py-4">
        {FACES.map((face) => (
          <button
            key={face.id}
            type="button"
            onClick={() => setActiveId(face.id)}
            className={`rounded border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[.14em] transition-colors ${
              face.id === activeId
                ? "border-[#ff0000] bg-[#ff0000]/15 text-white"
                : "border-white/15 text-white/70 hover:border-white/40 hover:text-white"
            }`}
          >
            {face.label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 px-6 pb-12 lg:grid-cols-2">
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-[.18em] text-white/45">HTML source (live)</h2>
          <div className="mt-3 inline-block rounded-lg border border-white/10 bg-[#c4a574] p-3 shadow-xl">
            <div ref={faceRef} style={{ width: active.width, height: active.height }} className="overflow-hidden bg-[#e8d4b0]">
              <Face {...active.propsFrom(data)} />
            </div>
          </div>
          <p className="mt-3 font-mono text-[11px] text-white/50">
            {active.width}×{active.height} CSS px
          </p>
        </section>

        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-[.18em] text-white/45">Baked texture preview</h2>
          <p className="mt-2 font-mono text-[11px] text-white/55">{status}</p>
          <div className="mt-3 inline-block rounded-lg border border-white/10 bg-black/40 p-3">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={`${active.label} bake preview`}
                width={active.width}
                height={active.height}
                className="block bg-[#e8d4b0]"
              />
            ) : (
              <div style={{ width: active.width, height: active.height }} className="grid place-items-center text-sm text-white/40">
                Waiting for bake…
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
