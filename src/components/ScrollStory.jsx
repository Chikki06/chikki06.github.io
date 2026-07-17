import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, useTexture } from "@react-three/drei";
import { DoubleSide, SRGBColorSpace } from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ExternalLink, Github, Linkedin, Mail } from "lucide-react";
import { useContent } from "../hooks/useContent.js";
import ProjectModal from "./ProjectModal.jsx";
import { createStoryData, projectSummary, projectTitle } from "./storyData.js";
import { Model as MonitorModel } from "../../monitor.jsx";

gsap.registerPlugin(ScrollTrigger);

const PAPER = "/assets/card.webp";
const ENVELOPE = "/assets/envelope.webp";
const TABLE = "/assets/table.webp";
const WALL = "/assets/wall.webp";
const DEMO_VIDEOS = ["/assets/demo1.mp4", "/assets/demo2.mp4", "/assets/demo3.mp4"];
const MONITOR_SCALE = 3.5;
// Calibrated from the generated `monitor.jsx` display mesh at a 0.003 scale.
// The display is 5.325 × 3.066 scene units; these dimensions leave the model's
// own bezel visible instead of replacing the monitor with a larger DOM rectangle.
const MONITOR_POSITION = [0, 2.7, -4.9];
// The authored model's feet sit 1.492 local units below its screen origin.
// Deriving Y from scale keeps the enlarged monitor grounded on the desk.
// Raised above the desk plane so the model's stand remains visibly grounded,
// rather than intersecting the tabletop at the enlarged presentation scale.
const MONITOR_TABLE_HEIGHT = 2.4;
const MONITOR_FOOT_OFFSET = 1.492;
const MONITOR_MODEL_OFFSET = [4.727, 0, 0];
const MONITOR_SCREEN = { width: 5.325, height: 3.066, y: 0.09, z: 0.057, distanceFactor: 2.46 };
const DEFAULT_MONITOR_TUNING = { modelScale: MONITOR_SCALE, screenScale: 1.081, frameFill: 0.89, cameraZLift: 0 };
const LETTER_POSITION = [1.05, 0.02, -1.85];
const LETTER_SIZE = { width: 6.1, height: 3.8 };
const CARD_SIZE = { width: 4.75, height: 2.7 };
const CARD_POSITION = [0, 0.02, 3];
const STORY_CHAPTER_PROGRESS = [0, 0.40, 0.71, 0.93];

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}

function monitorPosition(modelScale) {
  return [MONITOR_POSITION[0], MONITOR_TABLE_HEIGHT + MONITOR_FOOT_OFFSET * modelScale, MONITOR_POSITION[2]];
}

function hasWebGL() {
  if (typeof document === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function PaperMaterial({ roughness = 0.84 }) {
  const texture = useTexture(PAPER);
  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);
  return <meshStandardMaterial map={texture} roughness={roughness} side={DoubleSide} />;
}

function EnvelopeMaterial() {
  const texture = useTexture(ENVELOPE);
  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);
  return <meshStandardMaterial map={texture} roughness={0.88} side={DoubleSide} />;
}

function Desk() {
  const texture = useTexture(TABLE);
  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, -4.2]}>
      <planeGeometry args={[38, 32]} />
      <meshStandardMaterial map={texture} roughness={0.9} />
    </mesh>
  );
}

function Wall() {
  const texture = useTexture(WALL);
  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);
  return (
    <mesh receiveShadow position={[0, 10, -12]}>
      <planeGeometry args={[70, 50]} />
      <meshStandardMaterial map={texture} roughness={0.96} />
    </mesh>
  );
}

function BusinessCardFace({ data }) {
  return (
    <div className="h-[300px] w-[530px] overflow-hidden p-6 text-[#29241b] antialiased [backface-visibility:hidden]">
    <p className="font-mono text-[10px] uppercase tracking-[.28em] text-[#75664e]">Portfolio / 2026</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-.055em]">{data.hero.name}</h1>
      <p className="mt-3 max-w-[30rem] text-[14px] leading-5 text-[#5e5546]">{data.hero.tagline}</p>
      <p className="mt-3 font-mono text-[9px] uppercase tracking-[.14em] text-[#8f7351]">Software systems · ML research · product engineering</p>
      <div className="mt-7 flex items-center gap-4 text-[12px]">
        <a className="inline-flex items-center gap-2 underline decoration-[#a77d46] underline-offset-4 focus:outline-2 focus:outline-offset-4 focus:outline-[#6f4823]" href={`mailto:${data.email}`}><Mail className="h-3.5 w-3.5" />{data.email}</a>
        {data.github && <a className="inline-flex items-center gap-1.5 underline decoration-[#a77d46] underline-offset-4 focus:outline-2 focus:outline-offset-4 focus:outline-[#6f4823]" href={data.github.url} target="_blank" rel="noreferrer"><Github className="h-3.5 w-3.5" />GitHub</a>}
        {data.linkedin && <a className="inline-flex items-center gap-1.5 underline decoration-[#a77d46] underline-offset-4 focus:outline-2 focus:outline-offset-4 focus:outline-[#6f4823]" href={data.linkedin.url} target="_blank" rel="noreferrer"><Linkedin className="h-3.5 w-3.5" />LinkedIn</a>}
      </div>
      <p className="mt-9 font-mono text-[10px] uppercase tracking-[.22em] text-[#8f7351]">Scroll to lift the card</p>
    </div>
  );
}

function TimelineBack({ nodes }) {
  const experienceNodes = nodes.filter((node) => node.type !== "project");
  const captureScroll = (event) => {
    const element = event.currentTarget;
    const atTop = element.scrollTop <= 0;
    const atBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
    if ((event.deltaY < 0 && !atTop) || (event.deltaY > 0 && !atBottom)) event.stopPropagation();
  };

  return (
    <section className="h-[300px] w-[530px] overflow-hidden p-5 text-[#29241b] antialiased [backface-visibility:hidden]" aria-labelledby="timeline-heading">
      <div className="flex items-end justify-between border-b border-[#c8b28a] pb-3">
        <div><p className="font-mono text-[9px] uppercase tracking-[.22em] text-[#75664e]">Selected timeline</p><h2 id="timeline-heading" className="mt-1 text-2xl font-semibold tracking-[-.05em]">The path so far</h2></div>
        <span className="font-mono text-[9px] uppercase tracking-[.15em] text-[#8c724d]">{experienceNodes.length} entries</span>
      </div>
      <div className="mt-3 grid h-[210px] grid-cols-2 gap-x-4 gap-y-2 overflow-y-auto pr-2 [scrollbar-color:#a98250_transparent]" onWheelCapture={captureScroll} tabIndex={0} aria-label="Scrollable portfolio timeline">
        {experienceNodes.map((node) => (
          <article key={node.id || `${node.year}-${node.title}`} className="border-l-2 border-[#9b7d50]/70 pl-2.5">
            <p className="font-mono text-[8px] uppercase tracking-[.12em] text-[#8c724d]">{node.dateLabel || node.year || "Timeline"} · {node.type || "note"}</p>
            <h3 className="mt-0.5 text-[11px] font-semibold leading-[1.15]">{node.title || "Untitled entry"}</h3>
            <p className="mt-0.5 line-clamp-2 text-[9px] leading-3 text-[#63594a]">{node.organization || node.summary || ""}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function BusinessCard({ liftRef, spinRef, data }) {
  const frontPlaneRef = useRef(null);
  const backPlaneRef = useRef(null);
  useFrame(() => {
    const angle = spinRef.current?.rotation.y || 0;
    const frontFacing = Math.cos(angle) >= 0;
    if (frontPlaneRef.current) frontPlaneRef.current.style.visibility = frontFacing ? "visible" : "hidden";
    if (backPlaneRef.current) backPlaneRef.current.style.visibility = frontFacing ? "hidden" : "visible";
  });
  return (
    <group ref={liftRef} position={CARD_POSITION} rotation={[-Math.PI / 2, 0, 0]}>
      <group ref={spinRef}>
        <mesh castShadow receiveShadow><boxGeometry args={[CARD_SIZE.width, CARD_SIZE.height, 0.055]} /><PaperMaterial /></mesh>
        {/* Both planes stay mounted while the parent group flips; the rotation
            chooses which readable plane is facing the camera. */}
        <group position={[0, 0, 0.033]}>
          <Html transform center distanceFactor={3.2}><div ref={frontPlaneRef}><BusinessCardFace data={data} /></div></Html>
        </group>
        <group position={[0, 0, -0.033]} rotation={[0, Math.PI, 0]}>
          <Html transform center distanceFactor={3.2}><div ref={backPlaneRef} style={{ visibility: "hidden" }}><TimelineBack nodes={data.timeline} /></div></Html>
        </group>
      </group>
    </group>
  );
}

function demoSource(index) {
  return DEMO_VIDEOS[index % DEMO_VIDEOS.length];
}

function VideoThumbnail({ index, title, compact = false }) {
  const videoRef = useRef(null);
  const playPreview = () => videoRef.current?.play().catch(() => {});
  const stopPreview = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };
  return <div onPointerEnter={playPreview} onPointerLeave={stopPreview} className={`group relative overflow-hidden bg-black ${compact ? "aspect-video rounded" : "aspect-video rounded-md"}`}>
    <video ref={videoRef} src={demoSource(index)} muted loop playsInline preload="metadata" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" aria-label={`${title} fire demo preview`} />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
    <span className={`absolute bottom-2 right-2 rounded bg-red-700/90 font-mono text-white ${compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-1 text-[9px]"}`}>Watch</span>
    <span className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-400/80 bg-black/75 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${compact ? "px-2 py-1 text-[9px]" : "px-3 py-1.5 text-[11px]"}`}>Open project</span>
  </div>;
}

function MonitorProjectCard({ node, index = 0, onOpenProject }) {
  const project = node.project || {};
  return <button type="button" onClick={() => onOpenProject(node, index)} className="group relative block overflow-hidden rounded-md border border-red-950 bg-[#100303] text-left text-slate-100 shadow-lg transition hover:border-red-500 focus:outline-2 focus:outline-offset-2 focus:outline-red-400">
    <VideoThumbnail index={index} title={projectTitle(node)} />
    <div className="p-2.5"><p className="font-mono text-[8px] uppercase tracking-[.16em] text-red-400">Case {String(index + 1).padStart(2, "0")} · {node.dateLabel || node.year || "Project"}</p><h3 className="mt-1 text-[13px] font-semibold leading-tight group-hover:text-red-200">{projectTitle(node)}</h3><p className="mt-1 line-clamp-3 text-[10px] leading-[.875rem] text-slate-400">{projectSummary(node)}</p></div>
  </button>;
}

function ProjectMetadata({ project }) {
  const tags = [...new Set([...(project.tags || []), ...(project.technologies || [])])];
  const links = Array.isArray(project.links) ? project.links : [];
  return <><div className="mt-5 flex flex-wrap gap-1.5">{tags.map((tag) => <span key={tag} className="rounded border border-red-950 px-2 py-1 font-mono text-[9px] text-red-100">{tag}</span>)}</div><div className="mt-5 grid gap-2">{links.map((link) => <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-between rounded border border-red-900 px-3 py-2 text-xs hover:border-red-400">{link.label || "Open link"}<ExternalLink className="h-3.5 w-3.5" /></a>)}</div></>;
}

function MonitorProjectDetail({ node, index, projects, onSelect, onClose, scrollRef, onWheel }) {
  const project = node.project || {};
  const overview = (Array.isArray(project.overview) ? project.overview : [project.overview || projectSummary(node)]).filter(Boolean);
  const highlights = Array.isArray(project.highlights) ? project.highlights : [];
  const architecture = Array.isArray(project.architectureSections) ? project.architectureSections : [];
  const phases = Array.isArray(project.timeline) ? project.timeline : [];
  return <article ref={scrollRef} onWheel={onWheel} className="h-full overflow-y-auto rounded-md border border-red-950 bg-black p-4 text-slate-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    <div className="flex items-start justify-between gap-4 border-b border-red-950 pb-3"><div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-red-500">Case study {String(index + 1).padStart(2, "0")}</p><h2 className="mt-1 text-2xl font-semibold">{projectTitle(node)}</h2><p className="mt-1 text-xs text-slate-400">{project.subtitle || node.dateLabel}</p></div><button type="button" onClick={onClose} className="shrink-0 rounded border border-red-900 px-2.5 py-1.5 text-[10px] text-white hover:border-red-400 focus:outline-2 focus:outline-offset-2 focus:outline-red-400">All projects</button></div>
    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_190px] gap-4"><div><video src={demoSource(index)} controls autoPlay muted loop playsInline className="aspect-video w-full rounded-md bg-black object-cover" aria-label={`${projectTitle(node)} demo`} /><section className="mt-4"><h3 className="font-mono text-[10px] uppercase tracking-[.18em] text-amber-300">Description</h3><div className="mt-2 space-y-3 text-[12px] leading-5 text-slate-200">{overview.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</div>{highlights.length > 0 && <ul className="mt-4 grid gap-1.5 border-l border-amber-300/50 pl-3 text-[11px] leading-4 text-slate-300">{highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>}{phases.map((phase) => <section key={phase.title} className="mt-5 rounded border border-slate-800 bg-slate-900/50 p-3"><h4 className="text-sm font-semibold">{phase.title}</h4>{phase.description && <p className="mt-1 text-[11px] leading-4 text-slate-300">{phase.description}</p>}{phase.features?.length > 0 && <ul className="mt-2 grid gap-1 text-[10px] leading-4 text-slate-400">{phase.features.map((feature) => <li key={feature}>• {feature}</li>)}</ul>}</section>)}{architecture.map((section) => <section key={section.title} className="mt-5 border-t border-slate-800 pt-4"><h4 className="text-sm font-semibold">{section.title}</h4>{section.content && <p className="mt-1 text-[11px] leading-4 text-slate-300">{section.content}</p>}{section.points?.length > 0 && <ul className="mt-2 grid gap-1 text-[10px] leading-4 text-slate-400">{section.points.map((point) => <li key={point}>• {point}</li>)}</ul>}{section.subsections?.map((subsection) => <div key={subsection.title} className="mt-3 rounded bg-slate-900/70 p-3"><h5 className="text-[11px] font-semibold text-slate-100">{subsection.title}</h5>{subsection.content && <p className="mt-1 text-[10px] leading-4 text-slate-400">{subsection.content}</p>}{subsection.points?.length > 0 && <ul className="mt-2 grid gap-1 text-[10px] leading-4 text-slate-400">{subsection.points.map((point) => <li key={point}>• {point}</li>)}</ul>}</div>)}</section>)}<ProjectMetadata project={project} /></section></div>
      <aside className="border-l border-slate-800 pl-3"><p className="font-mono text-[9px] uppercase tracking-[.16em] text-slate-400">Recommended demos</p><div className="mt-3 grid gap-3">{projects.map((recommendation, recommendationIndex) => recommendationIndex === index ? null : <button key={recommendation.id} type="button" onClick={() => onSelect(recommendationIndex)} className="rounded border border-slate-800 bg-slate-900/40 p-1.5 text-left transition hover:border-amber-300 focus:outline-2 focus:outline-offset-2 focus:outline-white"><VideoThumbnail index={recommendationIndex} title={projectTitle(recommendation)} compact /><p className="mt-1.5 line-clamp-2 px-0.5 text-[10px] font-medium leading-3 text-white">{projectTitle(recommendation)}</p><p className="mt-1 px-0.5 font-mono text-[8px] text-slate-500">Demo {String(recommendationIndex + 1).padStart(2, "0")}</p></button>)}</div></aside>
    </div>
  </article>;
}

function MonitorScreen({ projects, interactive, onScrollControllerChange, screenScale }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const projectListRef = useRef(null);
  const detailRef = useRef(null);
  const activeScrollRef = useRef(null);

  useEffect(() => {
    activeScrollRef.current = selectedIndex === null ? projectListRef.current : detailRef.current;
  }, [selectedIndex]);

  const consumeWheel = useCallback((deltaY, deltaMode = 0) => {
    // A project detail is a captive reading surface: its wheel never advances
    // the story. The archive list hands the story back only at either edge.
    if (!interactive) return false;
    const element = activeScrollRef.current;
    if (!element) return false;
    const delta = deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? element.clientHeight : 1);
    if (selectedIndex !== null) {
      element.scrollTop += delta;
      return true;
    }
    const atTop = element.scrollTop <= 0;
    const atBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
    if ((delta < 0 && atTop) || (delta > 0 && atBottom) || delta === 0) return false;
    element.scrollTop += delta;
    return true;
  }, [interactive, selectedIndex]);

  useEffect(() => {
    onScrollControllerChange?.(consumeWheel);
    return () => onScrollControllerChange?.(null);
  }, [consumeWheel, onScrollControllerChange]);

  const handleWheel = useCallback((event) => {
    if (selectedIndex !== null) {
      event.preventDefault();
      event.stopPropagation();
      const element = detailRef.current;
      if (element) {
        const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1);
        element.scrollTop += delta;
      }
      return;
    }
    if (!consumeWheel(event.deltaY, event.deltaMode)) return;
    event.preventDefault();
    event.stopPropagation();
  }, [consumeWheel, selectedIndex]);

  return (
    <Html transform occlude center distanceFactor={MONITOR_SCREEN.distanceFactor * screenScale} position={[0, MONITOR_SCREEN.y, MONITOR_SCREEN.z + 0.007]} pointerEvents="auto">
      <section className="h-[465px] w-[808px] overflow-hidden bg-black p-4 text-white antialiased [isolation:isolate]" aria-label="Project monitor" aria-hidden={!interactive}>
        {selectedIndex !== null ? <MonitorProjectDetail node={projects[selectedIndex]} index={selectedIndex} projects={projects} onSelect={setSelectedIndex} scrollRef={detailRef} onWheel={handleWheel} onClose={() => setSelectedIndex(null)} /> : <><div className="mb-3 flex items-baseline justify-between border-b border-red-950 pb-2"><div><p className="font-mono text-[9px] uppercase tracking-[.22em] text-red-500">Selected work / video archive</p><h2 className="mt-1 text-xl font-semibold tracking-tight">Project vault</h2></div><span className="font-mono text-[9px] text-red-200/70">{projects.length} case studies</span></div><div ref={projectListRef} onWheel={handleWheel} className="grid h-[367px] grid-cols-3 gap-2 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{projects.map((node, index) => <MonitorProjectCard key={node.id} node={node} index={index} onOpenProject={(_node, nextIndex) => setSelectedIndex(nextIndex)} />)}</div></>}
      </section>
    </Html>
  );
}

function Monitor({ data, onReady, interactive, onScrollControllerChange, tuning }) {
  useEffect(() => onReady?.(), [onReady]);
  return (
    <group position={monitorPosition(tuning.modelScale)} scale={tuning.modelScale}>
      {/* GLTFJSX keeps the screen, bezel, stand, and controls in their authored hierarchy. */}
      <group position={MONITOR_MODEL_OFFSET} scale={0.003}><MonitorModel /></group>
      <mesh position={[0, MONITOR_SCREEN.y, MONITOR_SCREEN.z]}><planeGeometry args={[MONITOR_SCREEN.width, MONITOR_SCREEN.height]} /><meshStandardMaterial color="#020617" roughness={0.32} /></mesh>
      <MonitorScreen projects={data.projects} interactive={interactive} onScrollControllerChange={onScrollControllerChange} screenScale={tuning.screenScale} />
    </group>
  );
}

function Letter({ data }) {
  return (
    <group position={LETTER_POSITION} rotation={[-Math.PI / 2, 0, 0.14]}>
      <mesh castShadow receiveShadow><boxGeometry args={[LETTER_SIZE.width, LETTER_SIZE.height, 0.075]} /><EnvelopeMaterial /></mesh>
      <Html transform center distanceFactor={4.28} position={[0, 0, 0.037]}>
        <section className="relative grid h-[320px] w-[510px] grid-rows-[auto_1fr] overflow-hidden p-8 text-[#6b3827] antialiased [text-rendering:optimizeLegibility]" aria-label="Contact envelope">
          <p className="row-start-1 mt-3 self-start font-[Indie_Flower,cursive] text-[21px] tracking-[.03em]">Address:</p>
          <div className="absolute right-7 top-6 flex gap-2"><a href={data.linkedin?.url || "#"} target="_blank" rel="noreferrer" className="relative flex h-[78px] w-[78px] -rotate-6 items-center justify-center focus:outline-2 focus:outline-offset-3 focus:outline-[#6b3827]" aria-label="Akshat on LinkedIn"><img src="/assets/stamp.webp" alt="" className="absolute inset-0 h-full w-full object-contain" /><Linkedin className="relative h-5 w-5 text-[#7d4430]" /></a><a href={data.github?.url || "#"} target="_blank" rel="noreferrer" className="relative flex h-[78px] w-[78px] rotate-3 items-center justify-center focus:outline-2 focus:outline-offset-3 focus:outline-[#6b3827]" aria-label="Akshat on GitHub"><img src="/assets/stamp.webp" alt="" className="absolute inset-0 h-full w-full object-contain" /><Github className="relative h-5 w-5 text-[#7d4430]" /></a></div>
          <a href={`mailto:${data.email}`} className="row-start-2 mt-3 flex w-max max-w-none items-start self-center whitespace-nowrap font-[Indie_Flower,cursive] text-[32px] leading-none text-[#6b3827] focus:outline-2 focus:outline-offset-2 focus:outline-[#6b3827]" aria-label={`Email ${data.email}`}>{data.email}</a>
        </section>
      </Html>
    </group>
  );
}

function StoryCameraRig({ liftRef, spinRef, rootRef, setPhase, setStoryProgress, setCardFace, sceneReady, monitorTuning }) {
  const { camera, viewport, size } = useThree((state) => ({ camera: state.camera, viewport: state.viewport, size: state.size }));
  const target = useRef({ x: CARD_POSITION[0], y: CARD_POSITION[1], z: CARD_POSITION[2] });
  useFrame(() => camera.lookAt(target.current.x, target.current.y, target.current.z));
  useLayoutEffect(() => {
    const card = liftRef.current;
    const spin = spinRef.current;
    if (!card || !spin || !rootRef.current) return undefined;
    const narrow = viewport.aspect < 0.8;
    // The smaller card footprint is fitted against both live viewport axes.
    // This is applied before the first overhead frame, not only during the timeline beat.
    const baseCardScale = Math.min(1, viewport.width * (narrow ? 0.76 : 0.72) / CARD_SIZE.width, viewport.height * 0.72 / CARD_SIZE.height);
    const cardScale = baseCardScale;
    card.scale.setScalar(baseCardScale);
    camera.fov = narrow ? 39 : 43;
    camera.updateProjectionMatrix();
    // Fit the real GLTF display (not an arbitrary DOM canvas) to the safe monitor
    // frame in either a wide desktop window or a square/tall browser viewport.
    const halfVerticalFov = Math.tan((camera.fov * Math.PI) / 360);
    const monitorDistance = Math.max(
      (MONITOR_SCREEN.width * monitorTuning.modelScale) / (2 * halfVerticalFov * viewport.aspect * monitorTuning.frameFill),
      (MONITOR_SCREEN.height * monitorTuning.modelScale) / (2 * halfVerticalFov * monitorTuning.frameFill),
    );
    const monitorY = monitorPosition(monitorTuning.modelScale)[1];
    const monitorCamera = {
      x: 0,
      y: monitorY + MONITOR_SCREEN.y * monitorTuning.modelScale,
      z: MONITOR_POSITION[2] + monitorDistance * 0.98 + monitorTuning.cameraZLift,
    };
    const letterDistance = Math.max(
      LETTER_SIZE.width / (2 * halfVerticalFov * viewport.aspect * 0.5),
      LETTER_SIZE.height / (2 * halfVerticalFov * 0.6),
    );
    const letterCamera = {
      x: 0,
      y: LETTER_POSITION[1] + letterDistance * 0.998,
      z: LETTER_POSITION[2],
    };
    const cardCamera = { x: CARD_POSITION[0], y: narrow ? 7.7 : 6.5, z: CARD_POSITION[2] };
    camera.position.set(cardCamera.x, cardCamera.y, cardCamera.z);
    Object.assign(target.current, { x: CARD_POSITION[0], y: CARD_POSITION[1], z: CARD_POSITION[2] });
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "none" } });
      timeline
        .addLabel("card-overhead")
        .to({}, { duration: 0.45 })
        .to(card.position, { y: 2.1, duration: 0.85 })
        // Finish pulling back while the card rises, before any rotation begins.
        // This keeps every intermediate flip frame inside the viewport.
        .to(camera.position, { x: CARD_POSITION[0], y: narrow ? 12 : 10.5, z: CARD_POSITION[2], duration: 0.85 }, "<")
        .to(target.current, { x: CARD_POSITION[0], y: 1.35, z: CARD_POSITION[2], duration: 0.85 }, "<")
        .addLabel("card-lift")
        .to(spin.rotation, { y: Math.PI, duration: 0.9 })
        // Set the card back on the desk before showing its experience side.
        .to(card.position, { y: 0.02, duration: 0.55 })
        // Ease back to the opening's effective card distance for the stable read.
        .to(camera.position, { ...cardCamera, duration: 0.7 })
        .to(target.current, { x: CARD_POSITION[0], y: CARD_POSITION[1], z: CARD_POSITION[2], duration: 0.7 }, "<")
        // This preserves the fitted card dimensions after the camera has pulled back.
        .to(card.scale, { x: cardScale, y: cardScale, z: cardScale, duration: 0.45 })
        // Experience locks only once the flipped card has returned to its close,
        // readable framing; the next movement begins from this settled state.
        .addLabel("timeline-read")
        .to({}, { duration: 1.35 })
        .addLabel("monitor-approach")
        .to(camera.position, { ...monitorCamera, duration: 1.25 })
        .to(target.current, { x: 0, y: monitorY + MONITOR_SCREEN.y * monitorTuning.modelScale, z: MONITOR_POSITION[2], duration: 1.25 }, "<")
        .addLabel("monitor")
        // The camera is completely still here. The page wheel is routed to the
        // project list until it reaches an edge, regardless of pointer position.
        .to({}, { duration: 1.35 })
        .addLabel("letter")
        // The letter sits in front of the monitor, so this move never clips through it.
        .to(camera.position, { ...letterCamera, duration: 1.05 })
        .to(target.current, { x: 0, y: LETTER_POSITION[1], z: LETTER_POSITION[2], duration: 1.05 }, "<")
        .to({}, { duration: 0.8 });
      let lastPhase = 1;
      let lastCardFace = "front";
      ScrollTrigger.create({
        id: "portfolio-story",
        trigger: rootRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.65,
        animation: timeline,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          setStoryProgress(self.progress);
          const storyTime = self.progress * timeline.duration();
          // Neither DOM face is rendered while the physical card rotates. This is
          // deliberate: showing the reverse HTML through the front creates mirror text.
          const nextCardFace = storyTime < timeline.labels["card-lift"] ? "front" : storyTime < timeline.labels["timeline-read"] ? "none" : "back";
          if (nextCardFace !== lastCardFace) { lastCardFace = nextCardFace; setCardFace(nextCardFace); }
          const next = storyTime < timeline.labels["card-lift"] ? 1 : storyTime < timeline.labels.monitor ? 2 : storyTime < timeline.labels.letter ? 3 : 4;
          if (next !== lastPhase) { lastPhase = next; setPhase(next); }
        },
      });
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }, rootRef);
    return () => ctx.revert();
  }, [camera, liftRef, monitorTuning, rootRef, sceneReady, setCardFace, setPhase, setStoryProgress, size.height, size.width, spinRef, viewport.aspect, viewport.height, viewport.width]);
  return null;
}

function StoryCanvas({ data, phase, cardFace, rootRef, setPhase, setStoryProgress, setCardFace, onMonitorReady, onMonitorScrollControllerChange, monitorTuning }) {
  const liftRef = useRef();
  const spinRef = useRef();
  const [sceneReady, setSceneReady] = useState(false);
  const ready = useCallback(() => { setSceneReady(true); onMonitorReady?.(); }, [onMonitorReady]);
  return <Canvas shadows dpr={[1, 2]} camera={{ fov: 43, position: [0, 6.5, 1.25] }} gl={{ antialias: true, powerPreference: "high-performance" }}>
    <ambientLight intensity={0.8} /><directionalLight castShadow position={[4, 8, 3]} intensity={2.4} shadow-mapSize={[1024, 1024]} /><Environment preset="apartment" />
    <Wall /><Desk /><BusinessCard liftRef={liftRef} spinRef={spinRef} cardFace={cardFace} data={data} />
    <Suspense fallback={null}><Monitor data={data} onReady={ready} interactive={phase === 3} onScrollControllerChange={onMonitorScrollControllerChange} tuning={monitorTuning} /></Suspense>
    <Letter data={data} /><StoryCameraRig liftRef={liftRef} spinRef={spinRef} rootRef={rootRef} setPhase={setPhase} setStoryProgress={setStoryProgress} setCardFace={setCardFace} sceneReady={sceneReady} monitorTuning={monitorTuning} />
  </Canvas>;
}

function StaticPortfolioFallback({ data, reason, onOpenProject }) {
  return <main className="min-h-screen bg-slate-950 px-5 py-12 text-slate-100"><div className="mx-auto max-w-5xl">
    <p className="font-mono text-xs uppercase tracking-[.2em] text-amber-300">Portfolio</p><h1 className="mt-3 text-4xl font-semibold">{data.hero.name}</h1><p className="mt-3 max-w-2xl text-slate-300">{data.hero.tagline}</p>{reason && <p className="mt-4 text-sm text-slate-400">{reason}</p>}
    <section className="mt-12"><h2 className="text-2xl font-semibold">Timeline</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{data.timeline.map((node) => <article key={node.id} className="rounded border border-slate-700 bg-slate-900 p-4"><p className="font-mono text-xs text-amber-300">{node.dateLabel || node.year}</p><h3 className="mt-1 font-semibold">{node.title}</h3><p className="mt-1 text-sm text-slate-300">{node.summary || node.organization}</p></article>)}</div></section>
    <section className="mt-12"><h2 className="text-2xl font-semibold">Projects</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{data.projects.map((node, index) => <MonitorProjectCard key={node.id} node={node} index={index} onOpenProject={onOpenProject} />)}</div></section>
    <footer className="mt-12 border-t border-slate-700 pt-6 text-sm"><a className="underline" href={`mailto:${data.email}`}>{data.email}</a><p className="mt-5 text-xs text-slate-500">Monitor model by portgl16, licensed CC BY 4.0 via Sketchfab.</p></footer>
  </div></main>;
}

function StoryProgressNav({ phase, progress }) {
  const chapters = [
    { label: "Intro", progress: 0 },
    { label: "Experience", progress: 0.4 },
    { label: "Projects", progress: 0.71 },
    { label: "Contact", progress: 0.93 },
  ];
  const railRef = useRef(null);
  const expansionTimerRef = useRef(null);
  const [expandedChapter, setExpandedChapter] = useState(null);
  useEffect(() => () => clearTimeout(expansionTimerRef.current), []);
  const scrollToProgress = useCallback((progress, behavior = "auto") => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: Math.max(0, maxScroll * progress), behavior });
  }, []);
  const handleRailPointer = useCallback((event) => {
    const rail = railRef.current;
    if (!rail) return;
    const rect = rail.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    scrollToProgress(progress, "auto");
  }, [scrollToProgress]);

  return <nav style={{ zIndex: 20000000 }} className="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 sm:right-5" aria-label="Story chapters">
    <div className="relative flex h-[min(52vh,360px)] min-h-56 w-11 flex-col items-center justify-between rounded-full border border-white/10 bg-gradient-to-b from-white/12 via-black/55 to-black/35 py-3 text-white shadow-[0_18px_45px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.16)] ring-1 ring-red-950/35 backdrop-blur-xl">
      <div ref={railRef} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); handleRailPointer(event); }} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) handleRailPointer(event); }} className="absolute inset-y-7 left-1/2 w-1 -translate-x-1/2 cursor-ns-resize rounded-full bg-red-950/90" role="slider" aria-label="Story progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} tabIndex={0} onKeyDown={(event) => { if (event.key === "ArrowUp" || event.key === "ArrowLeft") { event.preventDefault(); scrollToProgress(Math.max(0, (phase - 2) / 3)); } if (event.key === "ArrowDown" || event.key === "ArrowRight") { event.preventDefault(); scrollToProgress(Math.min(1, phase / 3)); } }}>
        <span className="pointer-events-none absolute left-1/2 top-0 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-red-500 to-red-800" style={{ height: `${progress * 100}%` }} />
      </div>
      {chapters.map((chapter, index) => {
        const active = phase === index + 1;
        const completed = phase > index + 1;
        const clickExpanded = expandedChapter === index;
        return <button key={chapter.label} type="button" onClick={() => { setExpandedChapter(index); clearTimeout(expansionTimerRef.current); expansionTimerRef.current = setTimeout(() => setExpandedChapter(null), 650); scrollToProgress(chapter.progress); }} aria-current={active ? "step" : undefined} className={`group relative z-10 mr-2 flex h-7 w-7 self-end items-center overflow-hidden rounded-full px-2 font-mono text-xs transition-all duration-200 hover:w-32 focus-visible:w-32 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 ${clickExpanded ? "w-32" : ""} ${active ? "bg-red-600 text-white shadow-[0_0_16px_rgba(220,38,38,0.55)]" : completed ? "bg-red-950/90 text-red-200 hover:bg-red-900 hover:text-white" : "bg-black/80 text-white/65 hover:bg-red-950 hover:text-white"}`}><span>0{index + 1}</span><span className={`max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:ml-2 group-hover:max-w-20 group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-20 group-focus-visible:opacity-100 ${clickExpanded ? "ml-2 max-w-20 opacity-100" : ""}`}>{chapter.label}</span></button>;
      })}
    </div>
  </nav>;
}

export default function ScrollStory() {
  const { timeline, site, loading, error } = useContent();
  const rootRef = useRef();
  const lastProjectButton = useRef();
  const monitorScrollControllerRef = useRef(null);
  const [phase, setPhase] = useState(1);
  const [storyProgress, setStoryProgress] = useState(0);
  const [cardFace, setCardFace] = useState("front");
  const [modalProject, setModalProject] = useState(null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [webgl] = useState(hasWebGL);
  const data = useMemo(() => createStoryData(timeline, site), [timeline, site]);
  const openProject = useCallback((project, trigger) => { lastProjectButton.current = trigger; setModalProject(project); }, []);
  const closeProject = useCallback(() => { setModalProject(null); requestAnimationFrame(() => lastProjectButton.current?.focus()); }, []);
  const setMonitorScrollController = useCallback((controller) => {
    monitorScrollControllerRef.current = controller;
  }, []);
  useEffect(() => {
    const routeWheelToMonitor = (event) => {
      if (phase !== 3 || event.defaultPrevented) return;
      const consumed = monitorScrollControllerRef.current?.(event.deltaY, event.deltaMode);
      if (!consumed) return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("wheel", routeWheelToMonitor, { passive: false });
    return () => window.removeEventListener("wheel", routeWheelToMonitor);
  }, [phase]);
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">Loading portfolio…</div>;
  if (reducedMotion || !webgl) return <><StaticPortfolioFallback data={data} reason={reducedMotion ? "Reduced-motion view enabled." : "Interactive 3D is unavailable in this browser."} onOpenProject={openProject} /><ProjectModal project={modalProject} isOpen={Boolean(modalProject)} onClose={closeProject} /></>;
  return <main ref={rootRef} className="scroll-story relative h-[500vh] bg-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    <div className="sticky top-0 h-screen overflow-hidden"><StoryCanvas data={data} phase={phase} cardFace={cardFace} rootRef={rootRef} setPhase={setPhase} setStoryProgress={setStoryProgress} setCardFace={setCardFace} onMonitorReady={() => ScrollTrigger.refresh()} onMonitorScrollControllerChange={setMonitorScrollController} monitorTuning={DEFAULT_MONITOR_TUNING} />
      <StoryProgressNav phase={phase} progress={storyProgress} />
      <p className="pointer-events-none absolute bottom-5 left-5 rounded bg-slate-950/90 px-3 py-2 text-xs text-white/80">Scroll to explore</p>
      {error && <p className="pointer-events-none absolute bottom-5 right-5 max-w-xs text-right text-xs text-white/60">Showing bundled portfolio content.</p>}
      <p className="pointer-events-none absolute bottom-5 right-5 translate-y-6 text-[9px] text-white/40">Monitor model: portgl16 · CC BY 4.0</p>
    </div>
    {STORY_CHAPTER_PROGRESS.map((progress, index) => <span key={progress} id={["story-card", "story-experience", "story-projects", "story-letter"][index]} aria-hidden="true" className="pointer-events-none absolute left-0 h-px w-px" style={{ top: `${progress * 400}vh` }} />)}
    {["card-overhead", "timeline-read", "monitor", "letter"].map((chapter, index) => <section key={chapter} className="h-screen" aria-label={`Story chapter ${index + 1}: ${chapter}`} />)}
  </main>;
}
