import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useGLTF, useTexture } from "@react-three/drei";
import { ClampToEdgeWrapping, DoubleSide, SRGBColorSpace } from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import { useContent } from "../hooks/useContent.js";
import Portfolio from "./Portfolio.jsx";
import ProjectModal from "./ProjectModal.jsx";
import HoverDemoVideo from "./HoverDemoVideo.jsx";
import BakedHtmlFace from "./BakedHtmlFace.jsx";
import BusinessCardFront from "./storyFaces/BusinessCardFront.jsx";
import BusinessCardBack from "./storyFaces/BusinessCardBack.jsx";
import LetterFace from "./storyFaces/LetterFace.jsx";
import { createStoryData, projectSummary, projectTitle } from "./storyData.js";
import { ensureStoryFonts } from "../lib/storyFonts.js";
import { getCachedDemoSrc } from "../lib/demoVideoCache.js";
import { Model as MonitorModel } from "../models/Monitor.jsx";
import { Model as PolaroidModel } from "../models/Polaroid.jsx";
import { Model as PolaroidCameraModel } from "../models/Camera.jsx";

gsap.registerPlugin(ScrollTrigger);

const PAPER = "/assets/card.webp";
const ENVELOPE = "/assets/envelope.webp";
const TABLE = "/assets/table.webp";
const WALL = "/assets/wall.webp";
const DESK_TEXTURES = [PAPER, ENVELOPE, TABLE, WALL];
const MONITOR_GLTF = "/assets/monitor/scene.gltf";
const POLAROID_GLTF = "/assets/polaroid/scene.gltf";
const CAMERA_GLTF = "/assets/camera/scene.gltf";
const DEMO_BY_PROJECT_ID = {
  aerocast: { src: "/assets/aerocast.webm", href: "https://github.com/Chikki06/aerocast" },
  synapse: { src: "/assets/synapse.webm", href: "https://devpost.com/software/synapse-dx7hcr" },
  "cisl-platform": { src: "/assets/remotegpu.webm", href: "https://youtu.be/V6QrnFpiEwM" },
  "portfolio-site": { src: "/assets/site.webm", href: "https://akshatshahi.com" },
};

/** Wait until imgs under `root` have settled (or timeout). Used so 3D assets don't steal bandwidth. */
function whenImagesSettled(root, timeoutMs = 4500) {
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

/** Warm drei's loader cache for desk planes + GLTFs (camera.bin rides along with CAMERA_GLTF). */
function preloadStoryAssets({ heavy = false } = {}) {
  for (const src of DESK_TEXTURES) useTexture.preload(src);
  useGLTF.preload(MONITOR_GLTF);
  if (heavy) {
    useGLTF.preload(POLAROID_GLTF);
    useGLTF.preload(CAMERA_GLTF);
  }
}

function resolveNodeDemo(node) {
  const fromProject = node?.project?.demo;
  if (fromProject?.src) return fromProject;
  const fromDetail = node?.detail?.demo;
  if (fromDetail?.src) return fromDetail;
  if (node?.demo?.src) return node.demo;
  const id = node?.project?.id;
  return id && DEMO_BY_PROJECT_ID[id] ? DEMO_BY_PROJECT_ID[id] : null;
}

function demoSourceForNode(node, index = 0) {
  const demo = resolveNodeDemo(node);
  if (demo?.src) return demo;
  const fallbacks = Object.values(DEMO_BY_PROJECT_ID);
  return fallbacks[index % fallbacks.length] || null;
}
const MONITOR_SCALE = 3.5;
// Polaroid model is normalized flat on +Y with footprint ~32.5 × 1.44 × 32.4.
const POLAROID_NATIVE = { width: 32.541, height: 1.438, depth: 32.364 };
const DEG = Math.PI / 180;
const POLAROID_TUNING = {
  stackScale: 0.093,
  stackX: -6.82,
  stackY: -0.87,
  stackZ: 0.25,
  stackRotX: 0,
  stackRotY: 49,
  stackRotZ: 0,
  fanAB: 1.5,
  fanBC: 8,
  camScale: 0.49,
  camX: 4,
  camY: 0.65,
  camZ: -1.31,
  camRotX: 0,
  camRotY: -44,
  camRotZ: 0,
  // Final resting pose after the eject (outside the camera).
  floatX: -5.17,
  floatY: 1.12,
  floatZ: -1.88,
  floatRotX: -3,
  floatRotY: -41,
  floatRotZ: 180,
};
// Authored out→in; reversed here so scroll plays the photo eject (inside → out).
const POLAROID_EJECT_KEYFRAMES = [
  [-5.33, 1.12, -4.09],
  [-5.33, 1.12, -3.83],
  [-5.33, 1.12, -3.59],
  [-5.28, 1.12, -3.41],
  [-5.28, 1.12, -3.08],
  [-5.25, 1.12, -2.94],
  [-5.24, 1.12, -2.77],
  [-5.22, 1.12, -2.56],
  [-5.21, 1.12, -2.46],
  [-5.19, 1.12, -2.29],
  [-5.18, 1.12, -2.04],
  [-5.17, 1.12, -1.88],
];
const POLAROID_EJECT_START = POLAROID_EJECT_KEYFRAMES[0];

// Calibrated from the generated `Monitor.jsx` display mesh at a 0.003 scale.
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
const LETTER_FACE = { width: 510, height: 320 };
const CARD_SIZE = { width: 4.75, height: 2.7 };
const CARD_POSITION = [0, 0.02, 3];
const CARD_FACE = { width: 530, height: 300 };
// Chapter buttons map to timeline lock labels — progress is resolved live so
// polaroid / eject duration changes cannot leave the sidebar short of the beat.
const STORY_CHAPTERS = [
  { label: "Intro", id: "story-card", timelineLabel: "card-overhead", markerProgress: 0 },
  { label: "Experience", id: "story-experience", timelineLabel: "timeline-read", markerProgress: 0.29 },
  { label: "Headshot", id: "story-headshot", timelineLabel: "polaroid", markerProgress: 0.5 },
  { label: "Projects", id: "story-projects", timelineLabel: "monitor", markerProgress: 0.76 },
  { label: "Contact", id: "story-letter", timelineLabel: "letter", markerProgress: 0.94 },
];
// Fixed camera holds: park the rail on the chapter dot until `until` (journey starts).
// `until: null` means hold through the end of the timeline.
const STORY_LOCK_HOLDS = [
  { lock: "card-overhead", until: "card-depart" },
  { lock: "timeline-read", until: "polaroid-approach" },
  { lock: "polaroid", until: "monitor-approach" },
  { lock: "monitor", until: "letter-approach" },
  { lock: "letter", until: null },
];
// Keep a chapter bubble highlighted while remapped progress is within this
// distance of its rail slot (slots are 0.25 apart). Softens short lock holds.
const LOCK_HIGHLIGHT_SLACK = 0.08;
const INTRO_ZOOM_DURATION = 1.55;
const INTRO_CROSSFADE_DURATION = 0.75;
// Frame-fill for the polaroid overhead shot.
const POLAROID_FRAME_FILL = 0.62;
// How far the camera pulls back during the flip relative to the settled card distance.
const CARD_FLIP_PULL_FACTOR = 1.75;
// Story wheel soft-cap (never hard-stop). Monitor leave: Space or click after an edge prompt.
const STORY_WHEEL_MAX_DELTA = 160;
const STORY_WHEEL_MAX_SPEED = 2.6; // px/ms

// Clear any older durable preference so hard refresh always shows the desktop prompt.
if (typeof window !== "undefined") {
  try {
    window.localStorage.removeItem("portfolio-experience-pref");
  } catch {
    // Ignore private-mode failures.
  }
}

function getStoryScrollTrigger() {
  return ScrollTrigger.getById("portfolio-story");
}

/** Scroll within the story trigger range (not document scrollHeight). */
function scrollToStoryProgress(progress, behavior = "auto") {
  const clamped = Math.min(1, Math.max(0, progress));
  const trigger = getStoryScrollTrigger();
  if (trigger) {
    const top = trigger.start + (trigger.end - trigger.start) * clamped;
    window.scrollTo({ top, behavior });
    // scrub: 0.65 otherwise eases toward the target and feels like it stops short.
    if (behavior === "auto") {
      ScrollTrigger.update();
      trigger.getTween()?.progress(1);
    }
    return;
  }
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: Math.max(0, maxScroll * clamped), behavior });
}

function scrollToStoryLabel(timelineLabel, behavior = "auto") {
  const animation = getStoryScrollTrigger()?.animation;
  const time = animation?.labels?.[timelineLabel];
  const duration = animation?.duration() || 0;
  if (typeof time !== "number" || duration <= 0) {
    scrollToStoryProgress(0, behavior);
    return;
  }
  let progress = time / duration;
  // Exact label progress can round one scroll-pixel shy of the monitor hold, so the
  // expand control never mounts until a later wheel nudge. Land just inside the beat.
  if (timelineLabel === "monitor") {
    const letterT = animation.labels["letter-approach"];
    if (typeof letterT === "number") {
      const letterP = letterT / duration;
      progress = Math.min(letterP - 0.0005, progress + 0.001);
    }
  }
  scrollToStoryProgress(progress, behavior);
}

function storyProgressForLabel(timelineLabel) {
  const animation = getStoryScrollTrigger()?.animation;
  const time = animation?.labels?.[timelineLabel];
  const duration = animation?.duration() || 0;
  if (typeof time !== "number" || duration <= 0) return null;
  return time / duration;
}

/** Live lock anchors from the scrub timeline (progress 0–1). */
function getStoryLockAnchors() {
  const animation = getStoryScrollTrigger()?.animation;
  const duration = animation?.duration() || 0;
  const labels = animation?.labels;
  if (!labels || duration <= 0) return null;
  const anchors = [];
  for (const { lock, until } of STORY_LOCK_HOLDS) {
    const lockT = labels[lock];
    if (typeof lockT !== "number") return null;
    const untilT = until ? labels[until] : duration;
    if (typeof untilT !== "number") return null;
    anchors.push({ lockProgress: lockT / duration, untilProgress: untilT / duration });
  }
  return anchors;
}

/**
 * Remap scrub progress onto evenly spaced chapter dots.
 * Parks on a dot during each lock hold; lerps between dots on journeys.
 */
function storyProgressToNavProgress(storyProgress) {
  const anchors = getStoryLockAnchors();
  const n = STORY_CHAPTERS.length;
  if (!anchors || n < 2) return storyProgress;
  const slot = (i) => i / (n - 1);
  const p = Math.min(1, Math.max(0, storyProgress));
  if (p <= anchors[0].lockProgress) return 0;
  for (let i = 0; i < anchors.length; i += 1) {
    const a = anchors[i];
    const next = anchors[i + 1];
    if (p >= a.lockProgress && p < a.untilProgress) return slot(i);
    if (next && p >= a.untilProgress && p < next.lockProgress) {
      const span = Math.max(1e-6, next.lockProgress - a.untilProgress);
      return slot(i) + ((p - a.untilProgress) / span) * (slot(i + 1) - slot(i));
    }
  }
  return 1;
}

/** Inverse of storyProgressToNavProgress — rail pointer position → scrub progress. */
function navProgressToStoryProgress(navProgress) {
  const anchors = getStoryLockAnchors();
  const n = STORY_CHAPTERS.length;
  if (!anchors || n < 2) return navProgress;
  const slot = (i) => i / (n - 1);
  const p = Math.min(1, Math.max(0, navProgress));
  for (let i = 0; i < n; i += 1) {
    if (Math.abs(p - slot(i)) < 0.0005) return anchors[i].lockProgress;
  }
  for (let i = 0; i < n - 1; i += 1) {
    const s0 = slot(i);
    const s1 = slot(i + 1);
    if (p > s0 && p < s1) {
      const t = (p - s0) / (s1 - s0);
      const a = anchors[i];
      const next = anchors[i + 1];
      return a.untilProgress + t * (next.lockProgress - a.untilProgress);
    }
  }
  return anchors[n - 1].lockProgress;
}

function getPolaroidFraming(fov, aspect) {
  const tuning = POLAROID_TUNING;
  const halfVerticalFov = Math.tan((fov * Math.PI) / 360);
  const footprintW = POLAROID_NATIVE.width * tuning.stackScale;
  const footprintD = POLAROID_NATIVE.depth * tuning.stackScale;
  // Portrait phones: push in so the stack reads larger than the desktop overhead.
  const fill = aspect < 0.8 ? Math.min(0.88, POLAROID_FRAME_FILL + 0.22) : POLAROID_FRAME_FILL;
  const distance = Math.max(
    footprintW / (2 * halfVerticalFov * aspect * fill),
    footprintD / (2 * halfVerticalFov * fill),
  );
  return {
    camera: { x: tuning.stackX, y: tuning.stackY + distance, z: tuning.stackZ },
    target: { x: tuning.stackX, y: tuning.stackY, z: tuning.stackZ },
    distance,
  };
}

/** Overhead card distance from FOV + aspect so short landscape viewports get a closer read. */
function cardFrameFill(aspect, viewHeightPx) {
  // Portrait phones first — tall CSS height used to fall through to the loose 0.62 desktop fill.
  if (aspect < 0.8) return 0.94;
  // Phone landscape is short in CSS pixels; keep type large. Desktop stays closer to the old ~0.55–0.6 fill.
  if (typeof viewHeightPx === "number" && viewHeightPx > 0) {
    if (viewHeightPx < 480) return 0.92;
    if (viewHeightPx < 640) return 0.84;
    return 0.62;
  }
  if (aspect > 1.3) return 0.86;
  return 0.62;
}

function getCardFraming(fov, aspect, viewHeightPx) {
  const halfVerticalFov = Math.tan((fov * Math.PI) / 360);
  const fill = cardFrameFill(aspect, viewHeightPx);
  const distance = Math.max(
    CARD_SIZE.width / (2 * halfVerticalFov * aspect * fill),
    CARD_SIZE.height / (2 * halfVerticalFov * fill),
  );
  return {
    camera: { x: CARD_POSITION[0], y: CARD_POSITION[1] + distance, z: CARD_POSITION[2] },
    target: { x: CARD_POSITION[0], y: CARD_POSITION[1], z: CARD_POSITION[2] },
    distance,
  };
}

/** Shared poses for scroll scrubbing and the fullscreen → card intro zoom-out. */
function getStoryCameraPoses(fov, aspect, monitorTuning, viewHeightPx) {
  const narrow = aspect < 0.8;
  const halfVerticalFov = Math.tan((fov * Math.PI) / 360);
  const monitorFill = narrow ? Math.min(0.98, monitorTuning.frameFill + 0.08) : monitorTuning.frameFill;
  const monitorDistance = Math.max(
    (MONITOR_SCREEN.width * monitorTuning.modelScale) / (2 * halfVerticalFov * aspect * monitorFill),
    (MONITOR_SCREEN.height * monitorTuning.modelScale) / (2 * halfVerticalFov * monitorFill),
  );
  const monitorY = monitorPosition(monitorTuning.modelScale)[1];
  const card = getCardFraming(fov, aspect, viewHeightPx);
  return {
    narrow,
    cardCamera: card.camera,
    cardTarget: card.target,
    cardDistance: card.distance,
    monitorCamera: {
      x: 0,
      y: monitorY + MONITOR_SCREEN.y * monitorTuning.modelScale,
      z: MONITOR_POSITION[2] + monitorDistance * 0.98 + monitorTuning.cameraZLift,
    },
    monitorTarget: {
      x: 0,
      y: monitorY + MONITOR_SCREEN.y * monitorTuning.modelScale,
      z: MONITOR_POSITION[2],
    },
  };
}

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
    // repeat < 1 crops/zooms the map so paper grain reads larger on the card.
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.repeat.set(0.45, 0.45);
    texture.offset.set(0.275, 0.275);
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


function BusinessCard({ liftRef, spinRef, data }) {
  const frontKey = [data.hero.name, data.github?.url, data.linkedin?.url].join("|");
  const backKey = (data.timeline || [])
    .filter((node) => node.type !== "project")
    .map((node) => [node.id || `${node.year}-${node.title}`, node.organization || node.institution || "", node.dateLabel || node.year || ""].join("~"))
    .join("|");

  return (
    <group ref={liftRef} position={CARD_POSITION} rotation={[-Math.PI / 2, 0, 0]}>
      <group ref={spinRef}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[CARD_SIZE.width, CARD_SIZE.height, 0.055]} />
          <PaperMaterial />
        </mesh>
        {/* HTML faces are authored in storyFaces/, then baked to mesh textures. */}
        <group position={[0, 0, 0.033]}>
          <BakedHtmlFace
            designWidth={CARD_FACE.width}
            designHeight={CARD_FACE.height}
            meshWidth={CARD_SIZE.width}
            meshHeight={CARD_SIZE.height}
            bakeKey={`card-front:${frontKey}`}
          >
            <BusinessCardFront data={data} />
          </BakedHtmlFace>
        </group>
        <group position={[0, 0, -0.033]} rotation={[0, Math.PI, 0]}>
          <BakedHtmlFace
            designWidth={CARD_FACE.width}
            designHeight={CARD_FACE.height}
            meshWidth={CARD_SIZE.width}
            meshHeight={CARD_SIZE.height}
            bakeKey={`card-back:${backKey}`}
          >
            <BusinessCardBack nodes={data.timeline} />
          </BakedHtmlFace>
        </group>
        <Html wrapperClass="sr-only" style={{ pointerEvents: "auto" }}>
          <nav aria-label="Business card contacts">
            {data.github?.url && <a href={data.github.url} target="_blank" rel="noreferrer">GitHub</a>}
            {data.linkedin?.url && <a href={data.linkedin.url} target="_blank" rel="noreferrer">LinkedIn</a>}
          </nav>
        </Html>
      </group>
    </group>
  );
}

function VideoThumbnail({ node, index, title, compact = false }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [playbackSrc, setPlaybackSrc] = useState(null);
  const demo = demoSourceForNode(node, index);
  const shouldLoad = Boolean(demo?.src && inView);
  const playPreview = () => videoRef.current?.play().catch(() => {});
  const stopPreview = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };
  useEffect(() => {
    if (!demo?.src) return undefined;
    const nodeEl = containerRef.current;
    if (!nodeEl) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(nodeEl);
    return () => observer.disconnect();
  }, [demo?.src]);
  useEffect(() => {
    if (!shouldLoad || !demo?.src) {
      setPlaybackSrc(null);
      return undefined;
    }
    let cancelled = false;
    getCachedDemoSrc(demo.src).then((resolved) => {
      if (!cancelled) setPlaybackSrc(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [shouldLoad, demo?.src]);
  if (!demo?.src) return null;
  return (
    <div
      ref={containerRef}
      onPointerEnter={playPreview}
      onPointerLeave={stopPreview}
      className={`group relative overflow-hidden bg-black ${compact ? "aspect-video rounded" : "aspect-video rounded-md"}`}
    >
      {playbackSrc ? (
        <video
          ref={videoRef}
          src={playbackSrc}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          aria-label={`${title} demo preview`}
        />
      ) : (
        <div className="h-full w-full bg-neutral-950" aria-hidden="true" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
      <span
        className={`absolute bottom-2 right-2 rounded bg-red-700/90 font-mono text-white ${
          compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-1 text-[9px]"
        }`}
      >
        Open →
      </span>
    </div>
  );
}

function MonitorProjectCard({ node, index = 0, onOpenProject }) {
  const project = node.project || {};
  return (
    <button
      type="button"
      onClick={(event) => onOpenProject?.(project, event.currentTarget)}
      className="group relative block overflow-hidden rounded-md border border-red-950 bg-[#100303] text-left text-slate-100 shadow-lg transition hover:border-red-500 focus:outline-2 focus:outline-offset-2 focus:outline-red-400"
    >
      <VideoThumbnail node={node} index={index} title={projectTitle(node)} />
      <div className="p-2.5">
        <p className="font-mono text-[8px] uppercase tracking-[.16em] text-red-400">
          Case {String(index + 1).padStart(2, "0")} · {node.dateLabel || node.year || "Project"}
        </p>
        <h3 className="mt-1 text-[13px] font-semibold leading-tight group-hover:text-red-200">
          {projectTitle(node)}
        </h3>
        <p className="mt-1 line-clamp-3 text-[10px] leading-[.875rem] text-slate-400">
          {projectSummary(node)}
        </p>
      </div>
    </button>
  );
}

function ProjectMetadata({ project }) {
  const tags = [...new Set([...(project.tags || []), ...(project.technologies || [])])];
  const links = Array.isArray(project.links) ? project.links : [];
  return (
    <>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="rounded border border-red-950 px-2 py-1 font-mono text-[9px] text-red-100">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-5 grid gap-2">
        {links.map((link) => (
          <a
            key={`${link.label}-${link.url}`}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-between rounded border border-red-900 px-3 py-2 text-xs hover:border-red-400"
          >
            {link.label || "Open link"}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ))}
      </div>
    </>
  );
}

function MonitorProjectDetail({ node, index, projects, onSelect, onClose, scrollRef, onWheel }) {
  const project = node.project || {};
  const demo = demoSourceForNode(node, index);
  const features = Array.isArray(project.features) ? project.features : [];
  const highlights = features.length === 0 && Array.isArray(project.highlights) ? project.highlights : [];
  const summary = project.shortDescription || projectSummary(node);

  return (
    <article
      ref={scrollRef}
      onWheel={onWheel}
      className="h-full overflow-y-auto rounded-md border border-red-950 bg-black p-4 text-slate-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex items-start justify-between gap-4 border-b border-red-950 pb-3">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.2em] text-red-500">
            Case study {String(index + 1).padStart(2, "0")}
          </p>
          <h2 className="mt-1 text-2xl font-semibold">{projectTitle(node)}</h2>
          <p className="mt-1 text-xs text-slate-400">{project.subtitle || node.dateLabel}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded border border-red-900 px-2.5 py-1.5 text-[10px] text-white hover:border-red-400 focus:outline-2 focus:outline-offset-2 focus:outline-red-400"
        >
          All projects
        </button>
      </div>
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_190px] gap-4">
        <div>
          {demo?.src && (
            <HoverDemoVideo
              src={demo.src}
              href={demo.href}
              title={`${projectTitle(node)} demo`}
              className="rounded-md"
            />
          )}
          <section className="mt-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[.18em] text-amber-300">Overview</h3>
            <p className="mt-2 text-[12px] leading-5 text-slate-200">{summary}</p>
            {features.length > 0 && (
              <ul className="mt-4 grid gap-3">
                {features.map((feature) => {
                  const title = typeof feature === "string" ? feature : feature.title;
                  const description = typeof feature === "string" ? null : feature.description;
                  return (
                    <li key={title} className="border-l border-amber-300/50 pl-3">
                      <div className="text-[12px] font-semibold text-slate-100">{title}</div>
                      {description && (
                        <p className="mt-1 text-[11px] leading-4 text-slate-400">{description}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {highlights.length > 0 && (
              <ul className="mt-4 grid gap-1.5 border-l border-amber-300/50 pl-3 text-[11px] leading-4 text-slate-300">
                {highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            )}
            <ProjectMetadata project={project} />
          </section>
        </div>
        <aside className="border-l border-slate-800 pl-3">
          <p className="font-mono text-[9px] uppercase tracking-[.16em] text-slate-400">Other projects</p>
          <div className="mt-3 grid gap-3">
            {projects.map((recommendation, recommendationIndex) =>
              recommendationIndex === index ? null : (
                <button
                  key={recommendation.id}
                  type="button"
                  onClick={() => onSelect(recommendationIndex)}
                  className="rounded border border-slate-800 bg-slate-900/40 p-1.5 text-left transition hover:border-amber-300 focus:outline-2 focus:outline-offset-2 focus:outline-white"
                >
                  <VideoThumbnail
                    node={recommendation}
                    index={recommendationIndex}
                    title={projectTitle(recommendation)}
                    compact
                  />
                  <p className="mt-1.5 line-clamp-2 px-0.5 text-[10px] font-medium leading-3 text-white">
                    {projectTitle(recommendation)}
                  </p>
                </button>
              ),
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}

function MonitorScreen({ interactive, onScrollControllerChange, screenScale, hidden, edgeHint }) {
  // Keep one Html portal across lock/unlock — remounting flashed a second non-interactive
  // frame and also left stale pointer-events on drei's CSS3D wrapper.
  useLayoutEffect(() => {
    const live = document.querySelectorAll(".monitor-html-live");
    const ignored = document.querySelectorAll(".monitor-html-ignore");
    live.forEach((node) => {
      node.style.pointerEvents = "auto";
    });
    ignored.forEach((node) => {
      node.style.pointerEvents = "none";
    });
  }, [interactive, hidden]);

  if (hidden) return null;
  // Render a full-size portfolio layout, then CSS-scale it into the GLTF screen
  // so the monitor preview matches fullscreen proportions (not a comically large type scale).
  const frameWidth = 808;
  const frameHeight = 465;
  const virtualWidth = 1280;
  const scale = frameWidth / virtualWidth;
  const virtualHeight = frameHeight / scale;
  return (
    <Html
      transform
      center
      distanceFactor={MONITOR_SCREEN.distanceFactor * screenScale}
      position={[0, MONITOR_SCREEN.y, MONITOR_SCREEN.z + 0.007]}
      pointerEvents={interactive ? "auto" : "none"}
      wrapperClass={interactive ? "monitor-html-live" : "monitor-html-ignore"}
      style={{ pointerEvents: interactive ? "auto" : "none" }}
      zIndexRange={[10, 0]}
    >
      <section
        className="relative overflow-hidden bg-black text-white antialiased [isolation:isolate]"
        style={{ width: frameWidth, height: frameHeight, pointerEvents: interactive ? "auto" : "none" }}
        aria-label="Portfolio monitor"
        aria-hidden={!interactive}
      >
        <div className="origin-top-left" style={{ width: virtualWidth, height: virtualHeight, transform: `scale(${scale})`, pointerEvents: interactive ? "auto" : "none" }}>
          <Portfolio mode="monitor" loadMedia={interactive} className="h-full" onScrollControllerChange={interactive ? onScrollControllerChange : undefined} />
        </div>
        <MonitorEdgeHint edge={edgeHint} />
      </section>
    </Html>
  );
}

function Monitor({ onReady, interactive, onScrollControllerChange, tuning, screenHidden, edgeHint }) {
  useEffect(() => onReady?.(), [onReady]);
  return (
    <group position={monitorPosition(tuning.modelScale)} scale={tuning.modelScale}>
      {/* GLTFJSX keeps the screen, bezel, stand, and controls in their authored hierarchy. */}
      <group position={MONITOR_MODEL_OFFSET} scale={0.003}><MonitorModel /></group>
      {/* Skip raycasts so the backdrop plane can't steal pointer hits from the Html screen. */}
      <mesh position={[0, MONITOR_SCREEN.y, MONITOR_SCREEN.z]} raycast={() => null}>
        <planeGeometry args={[MONITOR_SCREEN.width, MONITOR_SCREEN.height]} />
        <meshStandardMaterial color="#020617" roughness={0.32} />
      </mesh>
      <MonitorScreen interactive={interactive} onScrollControllerChange={onScrollControllerChange} screenScale={tuning.screenScale} hidden={screenHidden} edgeHint={edgeHint} />
    </group>
  );
}


function Letter({ data }) {
  const bakeKey = [data.email, data.github?.url, data.linkedin?.url].join("|");
  return (
    <group position={LETTER_POSITION} rotation={[-Math.PI / 2, 0, 0.14]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[LETTER_SIZE.width, LETTER_SIZE.height, 0.075]} />
        <EnvelopeMaterial />
      </mesh>
      <group position={[0, 0, 0.038]}>
        <BakedHtmlFace
          designWidth={LETTER_FACE.width}
          designHeight={LETTER_FACE.height}
          meshWidth={LETTER_SIZE.width}
          meshHeight={LETTER_SIZE.height}
          bakeKey={`letter:${bakeKey}`}
        >
          <LetterFace data={data} />
        </BakedHtmlFace>
      </group>
      <Html wrapperClass="sr-only" style={{ pointerEvents: "auto" }}>
        <nav aria-label="Contact envelope">
          {data.linkedin?.url && <a href={data.linkedin.url} target="_blank" rel="noreferrer">Akshat on LinkedIn</a>}
          {data.github?.url && <a href={data.github.url} target="_blank" rel="noreferrer">Akshat on GitHub</a>}
          <a href={`mailto:${data.email}`}>Email {data.email}</a>
        </nav>
      </Html>
    </group>
  );
}

function PolaroidProps({ scale, fanAB, fanBC, tuning }) {
  return (
    <group
      position={[tuning.stackX, tuning.stackY, tuning.stackZ]}
      rotation={[tuning.stackRotX * DEG, tuning.stackRotY * DEG, tuning.stackRotZ * DEG]}
    >
      <group position={[0.1, 0.01, 0.05]} rotation={[0, fanAB + fanBC, 0]}>
        <PolaroidModel scale={scale} />
      </group>
      <group position={[0.04, 0.045, 0.02]} rotation={[0, fanAB, 0]}>
        <PolaroidModel scale={scale} />
      </group>
      <group position={[0, 0.08, 0]}>
        <PolaroidModel scale={scale} />
        <group
          position={[tuning.camX, tuning.camY, tuning.camZ]}
          rotation={[tuning.camRotX * DEG, tuning.camRotY * DEG, tuning.camRotZ * DEG]}
          scale={tuning.camScale}
        >
          <PolaroidCameraModel />
        </group>
      </group>
    </group>
  );
}

function PolaroidStack({ floatRef, enabled }) {
  const tuning = POLAROID_TUNING;
  const scale = tuning.stackScale;
  const fanAB = tuning.fanAB * DEG;
  const fanBC = tuning.fanBC * DEG;
  // Float anchor always mounts (scroll timeline target). Heavy GLTFs sit in their
  // own Suspense so a load suspension cannot clear the float ref.
  return (
    <>
      {enabled && (
        <Suspense fallback={null}>
          <PolaroidProps scale={scale} fanAB={fanAB} fanBC={fanBC} tuning={tuning} />
        </Suspense>
      )}
      <group
        ref={floatRef}
        rotation={[tuning.floatRotX * DEG, tuning.floatRotY * DEG, tuning.floatRotZ * DEG]}
      >
        {enabled && (
          <Suspense fallback={null}>
            <PolaroidModel scale={scale} />
          </Suspense>
        )}
      </group>
    </>
  );
}

function StoryCameraRig({ liftRef, spinRef, floatRef, rootRef, setPhase, setStoryProgress, setCardFace, setMonitorHoldActive, sceneReady, monitorTuning, cameraViewActive, holdMonitorCamera, introPhase, onIntroComplete }) {
  const { camera, viewport, size } = useThree((state) => ({ camera: state.camera, viewport: state.viewport, size: state.size }));
  const target = useRef({ x: CARD_POSITION[0], y: CARD_POSITION[1], z: CARD_POSITION[2] });
  const cameraViewActiveRef = useRef(cameraViewActive);
  const polaroidHoldRef = useRef(false);
  const introHoldRef = useRef(false);
  const holdMonitorCameraRef = useRef(holdMonitorCamera);
  cameraViewActiveRef.current = cameraViewActive;
  holdMonitorCameraRef.current = holdMonitorCamera;

  useFrame(() => {
    if (holdMonitorCameraRef.current || introHoldRef.current) {
      const poses = getStoryCameraPoses(camera.fov, viewport.aspect, monitorTuning, size.height);
      camera.position.set(poses.monitorCamera.x, poses.monitorCamera.y, poses.monitorCamera.z);
      Object.assign(target.current, poses.monitorTarget);
    } else if (polaroidHoldRef.current) {
      const framing = getPolaroidFraming(camera.fov, viewport.aspect);
      camera.position.set(framing.camera.x, framing.camera.y, framing.camera.z);
      Object.assign(target.current, framing.target);
    }
    camera.lookAt(target.current.x, target.current.y, target.current.z);
  });

  // Keep the camera on the monitor lock while the DOM portfolio covers the canvas,
  // so snapping the overlay away never flashes the chapter-1 card framing.
  useLayoutEffect(() => {
    const shouldHold = holdMonitorCamera || introPhase === "pin-monitor";
    if (!shouldHold) {
      if (introPhase !== "zoom-out") introHoldRef.current = false;
      return undefined;
    }
    const poses = getStoryCameraPoses(camera.fov, viewport.aspect, monitorTuning, size.height);
    const trigger = ScrollTrigger.getById("portfolio-story");
    trigger?.disable(false);
    introHoldRef.current = true;
    polaroidHoldRef.current = false;
    camera.position.set(poses.monitorCamera.x, poses.monitorCamera.y, poses.monitorCamera.z);
    Object.assign(target.current, poses.monitorTarget);
    return undefined;
  }, [camera, holdMonitorCamera, introPhase, monitorTuning, size.height, viewport.aspect]);

  // Reverse of the part-4 zoom-in: pull back from the monitor and pan to the part-1 card.
  useEffect(() => {
    if (introPhase !== "zoom-out") return undefined;
    const poses = getStoryCameraPoses(camera.fov, viewport.aspect, monitorTuning, size.height);
    introHoldRef.current = false;
    holdMonitorCameraRef.current = false;
    camera.position.set(poses.monitorCamera.x, poses.monitorCamera.y, poses.monitorCamera.z);
    Object.assign(target.current, poses.monitorTarget);
    const tween = gsap.timeline({
      defaults: { duration: INTRO_ZOOM_DURATION, ease: "power1.inOut" },
      onComplete: () => {
        window.scrollTo(0, 0);
        const trigger = ScrollTrigger.getById("portfolio-story");
        trigger?.animation?.progress(0);
        trigger?.enable(true);
        requestAnimationFrame(() => {
          ScrollTrigger.refresh();
          ScrollTrigger.update();
        });
        onIntroComplete?.();
      },
    });
    tween
      .to(camera.position, { ...poses.cardCamera })
      .to(target.current, { ...poses.cardTarget }, "<");
    return () => {
      tween.kill();
    };
  }, [camera, introPhase, monitorTuning, onIntroComplete, size.height, viewport.aspect]);

  useLayoutEffect(() => {
    const card = liftRef.current;
    const spin = spinRef.current;
    const floatGroup = floatRef?.current;
    if (!card || !spin || !rootRef.current) return undefined;
    const { narrow } = getStoryCameraPoses(camera.fov || (viewport.aspect < 0.8 ? 39 : 43), viewport.aspect, monitorTuning, size.height);
    // Card stays at authored size; camera distance adapts to the viewport so
    // landscape phones get a close, readable overhead instead of a shrunk mesh.
    card.scale.setScalar(1);
    camera.fov = narrow ? 39 : 43;
    camera.updateProjectionMatrix();
    const refreshed = getStoryCameraPoses(camera.fov, viewport.aspect, monitorTuning, size.height);
    const flipPullY = refreshed.cardDistance * CARD_FLIP_PULL_FACTOR;
    const halfVerticalFov = Math.tan((camera.fov * Math.PI) / 360);
    const letterWidthFill = narrow ? 0.72 : 0.5;
    const letterHeightFill = narrow ? 0.82 : 0.6;
    const letterDistance = Math.max(
      LETTER_SIZE.width / (2 * halfVerticalFov * viewport.aspect * letterWidthFill),
      LETTER_SIZE.height / (2 * halfVerticalFov * letterHeightFill),
    );
    const letterCamera = {
      x: 0,
      y: LETTER_POSITION[1] + letterDistance * 0.998,
      z: LETTER_POSITION[2],
    };
    const polaroidFraming = getPolaroidFraming(camera.fov, viewport.aspect);
    const APPROACH_MID = 0.30;
    const midCamera = {
      x: polaroidFraming.camera.x + (refreshed.monitorCamera.x - polaroidFraming.camera.x) * APPROACH_MID,
      y: polaroidFraming.camera.y + (refreshed.monitorCamera.y - polaroidFraming.camera.y) * APPROACH_MID,
      z: polaroidFraming.camera.z + (refreshed.monitorCamera.z - polaroidFraming.camera.z) * APPROACH_MID,
    };
    const midTarget = {
      x: polaroidFraming.target.x + (refreshed.monitorTarget.x - polaroidFraming.target.x) * APPROACH_MID,
      y: polaroidFraming.target.y + (refreshed.monitorTarget.y - polaroidFraming.target.y) * APPROACH_MID,
      z: polaroidFraming.target.z + (refreshed.monitorTarget.z - polaroidFraming.target.z) * APPROACH_MID,
    };
    // Only seed the card framing on a cold start. Rebuilding mid-scroll used to snap
    // the camera to chapter 1 for a frame (the "reset canvas" flash on 4→3 / 4→5).
    const scrollRoot = rootRef.current;
    const scrollable = Math.max(1, (scrollRoot?.offsetHeight || 0) - window.innerHeight);
    const scrollProgress = Math.min(1, Math.max(0, window.scrollY / scrollable));
    if (!introHoldRef.current && !holdMonitorCameraRef.current && scrollProgress < 0.001) {
      camera.position.set(refreshed.cardCamera.x, refreshed.cardCamera.y, refreshed.cardCamera.z);
      Object.assign(target.current, refreshed.cardTarget);
    }
    if (floatGroup) {
      floatGroup.position.set(POLAROID_EJECT_START[0], POLAROID_EJECT_START[1], POLAROID_EJECT_START[2]);
    }
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "none" } });
      const approachDuration = 1.55;
      const ejectDuration = 1.35;
      timeline
        .addLabel("card-overhead")
        .to({}, { duration: 0.55 })
        .addLabel("card-depart")
        .to(card.position, { y: 2.1, duration: 0.85 })
        // Finish pulling back while the card rises, before any rotation begins.
        // This keeps every intermediate flip frame inside the viewport.
        .to(camera.position, { x: CARD_POSITION[0], y: flipPullY, z: CARD_POSITION[2], duration: 0.85 }, "<")
        .to(target.current, { x: CARD_POSITION[0], y: 1.35, z: CARD_POSITION[2], duration: 0.85 }, "<")
        .addLabel("card-lift")
        .to(spin.rotation, { y: Math.PI, duration: 0.9 })
        // Set the card back on the desk before showing its experience side.
        .to(card.position, { y: 0.02, duration: 0.55 })
        // Ease back to the opening's effective card distance for the stable read.
        .to(camera.position, { ...refreshed.cardCamera, duration: 0.7 })
        .to(target.current, { ...refreshed.cardTarget, duration: 0.7 }, "<")
        // Experience locks only once the flipped card has returned to its close,
        // readable framing; the next movement begins from this settled state.
        .addLabel("timeline-read")
        .to({}, { duration: 1.2 })
        // Smooth slide from settled flipped card → live polaroid overhead.
        .addLabel("polaroid-approach")
        .to(camera.position, { ...polaroidFraming.camera, duration: 1.55, ease: "power1.inOut" })
        .to(target.current, { ...polaroidFraming.target, duration: 1.55, ease: "power1.inOut" }, "<")
        .addLabel("polaroid")
        .to({}, { duration: 0.75 })
        // Leave polaroid overhead → early mid-point toward the monitor.
        .addLabel("monitor-approach")
        .to(camera.position, { ...midCamera, duration: approachDuration * APPROACH_MID, ease: "power1.inOut" })
        .to(target.current, { ...midTarget, duration: approachDuration * APPROACH_MID, ease: "power1.inOut" }, "<")
        // Pseudo-stop (unnumbered): camera holds while scroll drives the photo eject.
        .addLabel("polaroid-eject");
      if (floatGroup) {
        const ejectStep = ejectDuration / (POLAROID_EJECT_KEYFRAMES.length - 1);
        for (let i = 1; i < POLAROID_EJECT_KEYFRAMES.length; i += 1) {
          const [x, y, z] = POLAROID_EJECT_KEYFRAMES[i];
          timeline.to(floatGroup.position, { x, y, z, duration: ejectStep, ease: "none" });
        }
      } else {
        timeline.to({}, { duration: ejectDuration });
      }
      timeline
        // Eject finished — complete the remaining approach into the monitor lock.
        .addLabel("monitor-finish")
        .to(camera.position, { ...refreshed.monitorCamera, duration: approachDuration * (1 - APPROACH_MID), ease: "power1.inOut" })
        .to(target.current, { ...refreshed.monitorTarget, duration: approachDuration * (1 - APPROACH_MID), ease: "power1.inOut" }, "<")
        .addLabel("monitor")
        // Short park beat for the locked monitor list. Keep this small so leave snaps
        // don't haul the sidebar across a huge empty scrub range.
        .to({}, { duration: 0.25 })
        .addLabel("letter-approach")
        // The letter sits in front of the monitor, so this move never clips through it.
        // Label after the settle — same pattern as polaroid/monitor — so chapter 05 lands on the letter.
        .to(camera.position, { ...letterCamera, duration: 1.05 })
        .to(target.current, { x: 0, y: LETTER_POSITION[1], z: LETTER_POSITION[2], duration: 1.05 }, "<")
        .addLabel("letter")
        .to({}, { duration: 0.8 });
      let lastPhase = 1;
      let lastCardFace = "front";
      let lastMonitorHold = false;
      ScrollTrigger.create({
        id: "portfolio-story",
        trigger: rootRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.65,
        animation: timeline,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // While the monitor site is fullscreened, scroll must not scrub the camera.
          if (!cameraViewActiveRef.current) return;
          setStoryProgress(self.progress);
          const storyTime = self.progress * timeline.duration();
          // Overhead lock only for the polaroid hold — release once the 3→4 pan begins.
          polaroidHoldRef.current = storyTime >= timeline.labels.polaroid && storyTime < timeline.labels["monitor-approach"];
          // Neither DOM face is rendered while the physical card rotates. This is
          // deliberate: showing the reverse HTML through the front creates mirror text.
          const nextCardFace = storyTime < timeline.labels["card-lift"] ? "front" : storyTime < timeline.labels["timeline-read"] ? "none" : "back";
          if (nextCardFace !== lastCardFace) { lastCardFace = nextCardFace; setCardFace(nextCardFace); }
          // Phase is the parked lock (1–5), or 0 while traveling between locks.
          // Do not scrollTo from here — mutating scroll inside onUpdate slingshots the scrub.
          const monitorT = timeline.labels.monitor;
          const letterApproachT = timeline.labels["letter-approach"];
          let next = 0;
          for (let i = 0; i < STORY_LOCK_HOLDS.length; i += 1) {
            const { lock, until } = STORY_LOCK_HOLDS[i];
            const lockT = timeline.labels[lock];
            const untilT = until ? timeline.labels[until] : timeline.duration();
            if (storyTime >= lockT && (until ? storyTime < untilT : storyTime <= untilT)) {
              next = i + 1;
              break;
            }
          }
          if (next !== lastPhase) { lastPhase = next; setPhase(next); }
          const monitorHold = storyTime >= monitorT && storyTime < letterApproachT;
          if (monitorHold !== lastMonitorHold) {
            lastMonitorHold = monitorHold;
            setMonitorHoldActive(monitorHold);
          }
        },
      });
      // Snap the scrub target to the current scroll immediately so a mid-story
      // rebuild never eases from progress 0 (card) through a visible flash.
      if (!introHoldRef.current && !holdMonitorCameraRef.current && scrollProgress > 0.001) {
        timeline.progress(scrollProgress);
        ScrollTrigger.getById("portfolio-story")?.getTween()?.progress(1);
        const storyTime = scrollProgress * timeline.duration();
        polaroidHoldRef.current = storyTime >= timeline.labels.polaroid && storyTime < timeline.labels["monitor-approach"];
        const monitorHold = storyTime >= timeline.labels.monitor && storyTime < timeline.labels["letter-approach"];
        lastMonitorHold = monitorHold;
        setMonitorHoldActive(monitorHold);
        setStoryProgress(scrollProgress);
        let next = 0;
        for (let i = 0; i < STORY_LOCK_HOLDS.length; i += 1) {
          const { lock, until } = STORY_LOCK_HOLDS[i];
          const lockT = timeline.labels[lock];
          const untilT = until ? timeline.labels[until] : timeline.duration();
          if (storyTime >= lockT && (until ? storyTime < untilT : storyTime <= untilT)) {
            next = i + 1;
            break;
          }
        }
        lastPhase = next;
        setPhase(next);
      }
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }, rootRef);
    return () => {
      polaroidHoldRef.current = false;
      if (floatGroup) {
        floatGroup.position.set(POLAROID_EJECT_START[0], POLAROID_EJECT_START[1], POLAROID_EJECT_START[2]);
      }
      ctx.revert();
    };
  }, [camera, floatRef, liftRef, monitorTuning, rootRef, sceneReady, setCardFace, setMonitorHoldActive, setPhase, setStoryProgress, size.height, size.width, spinRef, viewport.aspect, viewport.height, viewport.width]);
  return null;
}

function StoryCanvas({ data, phase, cardFace, rootRef, setPhase, setStoryProgress, setCardFace, setMonitorHoldActive, onMonitorReady, onMonitorScrollControllerChange, monitorTuning, cameraViewActive, monitorFullscreen, holdMonitorCamera, introPhase, onIntroComplete, monitorEdgeHint, monitorHoldActive, heavyPropsEnabled }) {
  const liftRef = useRef();
  const spinRef = useRef();
  const floatRef = useRef();
  const [sceneReady, setSceneReady] = useState(false);
  const [floatReady, setFloatReady] = useState(false);
  const ready = useCallback(() => { setSceneReady(true); onMonitorReady?.(); }, [onMonitorReady]);
  const setFloatNode = useCallback((node) => {
    floatRef.current = node;
    if (node) {
      node.position.set(POLAROID_EJECT_START[0], POLAROID_EJECT_START[1], POLAROID_EJECT_START[2]);
    }
    setFloatReady(Boolean(node));
  }, []);
  const monitorInteractive = monitorHoldActive && !monitorFullscreen && !introPhase;
  // Keep the in-monitor site hidden only while the DOM fullscreen portfolio owns the view.
  // During the intro fade, monitorFullscreen is already false so the 3D screen can crossfade in.
  // While the monitor Html is live, disable pointer events on the WebGL canvas so it can't
  // capture clicks meant for links/buttons on the CSS3D screen.
  return <Canvas shadows dpr={[1, 2]} camera={{ fov: 43, position: [0, 6.5, 1.25] }} gl={{ antialias: true, powerPreference: "high-performance" }} style={monitorInteractive ? { pointerEvents: "none" } : undefined}>
    {/* Local lights only — Environment preset="apartment" pulled lebombo_1k.hdr from a CDN. */}
    <hemisphereLight args={["#f3efe6", "#1a1a1a", 0.55]} />
    <ambientLight intensity={0.55} />
    <directionalLight castShadow position={[4, 8, 3]} intensity={2.15} shadow-mapSize={[1024, 1024]} />
    <directionalLight position={[-3, 4, -2]} intensity={0.55} />
    <directionalLight position={[2, 2, 5]} intensity={0.35} color="#c8d7ff" />
    <Suspense fallback={null}>
      <Wall /><Desk /><BusinessCard liftRef={liftRef} spinRef={spinRef} cardFace={cardFace} data={data} />
      <Letter data={data} />
    </Suspense>
    <PolaroidStack floatRef={setFloatNode} enabled={heavyPropsEnabled} />
    <Suspense fallback={null}><Monitor onReady={ready} interactive={monitorInteractive} onScrollControllerChange={onMonitorScrollControllerChange} tuning={monitorTuning} screenHidden={monitorFullscreen} edgeHint={monitorEdgeHint} /></Suspense>
    <StoryCameraRig liftRef={liftRef} spinRef={spinRef} floatRef={floatRef} rootRef={rootRef} setPhase={setPhase} setStoryProgress={setStoryProgress} setCardFace={setCardFace} setMonitorHoldActive={setMonitorHoldActive} sceneReady={sceneReady && floatReady} monitorTuning={monitorTuning} cameraViewActive={cameraViewActive} holdMonitorCamera={holdMonitorCamera} introPhase={introPhase} onIntroComplete={onIntroComplete} />
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
  const chapters = STORY_CHAPTERS;
  const railRef = useRef(null);
  const expansionTimerRef = useRef(null);
  const [expandedChapter, setExpandedChapter] = useState(null);
  // Top horizontal rail on phones; side vertical rail from sm up.
  const isMobileNav = useMediaQuery("(max-width: 639px)");
  useEffect(() => () => clearTimeout(expansionTimerRef.current), []);
  const handleRailPointer = useCallback((event) => {
    const rail = railRef.current;
    if (!rail) return;
    const rect = rail.getBoundingClientRect();
    const nav = isMobileNav
      ? Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
      : Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    scrollToStoryProgress(navProgressToStoryProgress(nav), "auto");
  }, [isMobileNav]);
  const slots = Math.max(1, chapters.length - 1);
  // Nearest chapter within slack of the remapped fill — sticks highlight around short locks.
  let highlightIndex = -1;
  let highlightDist = Infinity;
  for (let i = 0; i < chapters.length; i += 1) {
    const dist = Math.abs(progress - i / slots);
    if (dist <= LOCK_HIGHLIGHT_SLACK && dist < highlightDist) {
      highlightDist = dist;
      highlightIndex = i;
    }
  }
  if (highlightIndex < 0 && phase > 0) highlightIndex = phase - 1;
  const goToAdjacentChapter = useCallback((direction) => {
    const currentIndex = highlightIndex >= 0 ? highlightIndex : Math.round(progress * slots);
    const nextIndex = Math.min(chapters.length - 1, Math.max(0, currentIndex + direction));
    scrollToStoryLabel(chapters[nextIndex].timelineLabel);
  }, [chapters, highlightIndex, progress, slots]);
  const activeLabel = expandedChapter != null
    ? chapters[expandedChapter]?.label
    : (highlightIndex >= 0 ? chapters[highlightIndex]?.label : null);

  return (
    <nav
      style={{ zIndex: 11 }}
      className="pointer-events-auto absolute left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] -translate-x-1/2 sm:left-auto sm:right-5 sm:top-1/2 sm:translate-x-0 sm:-translate-y-1/2"
      aria-label="Story chapters"
    >
      <div className="relative flex h-11 w-[min(92vw,360px)] flex-row items-center justify-between rounded-full border border-white/10 bg-gradient-to-r from-white/12 via-black/55 to-black/35 px-3 text-white shadow-[0_18px_45px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl sm:h-[min(52vh,360px)] sm:min-h-56 sm:w-11 sm:flex-col sm:bg-gradient-to-b sm:px-0 sm:py-3">
        <div
          ref={railRef}
          onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); handleRailPointer(event); }}
          onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) handleRailPointer(event); }}
          className="absolute inset-x-7 top-1/2 h-1 -translate-y-1/2 cursor-ew-resize rounded-full bg-black sm:inset-x-auto sm:inset-y-7 sm:left-1/2 sm:h-auto sm:w-1 sm:-translate-x-1/2 sm:translate-y-0 sm:cursor-ns-resize"
          role="slider"
          aria-label="Story progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-orientation={isMobileNav ? "horizontal" : "vertical"}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp" || event.key === "ArrowLeft") { event.preventDefault(); goToAdjacentChapter(-1); }
            if (event.key === "ArrowDown" || event.key === "ArrowRight") { event.preventDefault(); goToAdjacentChapter(1); }
          }}
        >
          <span
            className="pointer-events-none absolute left-0 top-0 h-full rounded-full bg-[#FF0000] sm:left-1/2 sm:w-full sm:-translate-x-1/2"
            style={isMobileNav ? { width: `${progress * 100}%` } : { height: `${progress * 100}%` }}
          />
        </div>
        {chapters.map((chapter, index) => {
          const slot = index / slots;
          const active = highlightIndex === index;
          const completed = !active && progress >= slot;
          const clickExpanded = expandedChapter === index;
          const bubbleTone = active
            ? "bg-[#FF0000] text-white shadow-[0_0_16px_rgba(255,0,0,0.55)]"
            : completed
              ? "bg-[#4a1010] text-[#ffb0b0] ring-1 ring-[#FF0000]/40 hover:bg-[#FF0000] hover:text-white hover:ring-[#FF0000]"
              : "bg-black/80 text-white hover:bg-[#FF0000] hover:text-white";
          return (
            <button
              key={chapter.label}
              type="button"
              onClick={() => {
                setExpandedChapter(index);
                clearTimeout(expansionTimerRef.current);
                expansionTimerRef.current = setTimeout(() => setExpandedChapter(null), 650);
                scrollToStoryLabel(chapter.timelineLabel);
              }}
              aria-current={active ? "step" : undefined}
              aria-label={chapter.label}
              title={chapter.label}
              className={`group relative z-10 flex h-7 w-7 shrink-0 items-center overflow-hidden rounded-full px-2 font-mono text-xs transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF0000] sm:mr-2 sm:self-end sm:hover:w-32 sm:focus-visible:w-32 ${clickExpanded && !isMobileNav ? "sm:w-32" : ""} ${bubbleTone}`}
            >
              <span>0{index + 1}</span>
              <span className={`hidden max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 sm:inline sm:group-hover:ml-2 sm:group-hover:max-w-20 sm:group-hover:opacity-100 sm:group-focus-visible:ml-2 sm:group-focus-visible:max-w-20 sm:group-focus-visible:opacity-100 ${clickExpanded ? "sm:ml-2 sm:max-w-20 sm:opacity-100" : ""}`}>
                {chapter.label}
              </span>
            </button>
          );
        })}
      </div>
      {isMobileNav && activeLabel ? (
        <p className="pointer-events-none mt-1.5 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
          {activeLabel}
        </p>
      ) : null}
    </nav>
  );
}

function MonitorChromeControls({ fullscreen, onToggleFullscreen, exitHint = false, hint, shortcut }) {
  // One above the monitor Html zIndexRange max (10) so the control stays clickable over the screen.
  const label = hint || (fullscreen ? "Desk view" : "Expand site");
  const key = shortcut || (fullscreen ? "Esc" : "F");
  return (
    <div
      style={{ zIndex: 11 }}
      className="pointer-events-auto absolute bottom-4 right-4 flex items-center gap-2 pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)]"
    >
      <div className="group relative">
        <span
          className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap border border-white/15 bg-black/90 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[.16em] text-white/75 opacity-0 shadow-lg backdrop-blur-md transition group-hover:opacity-100 group-focus-within:opacity-100 sm:block"
          aria-hidden="true"
        >
          {label}
          <span className="ml-2 text-[#FF0000]">{key}</span>
        </span>
        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label={`${label} (${key})`}
          title={`${label} (${key})`}
          className={`flex h-10 w-10 items-center justify-center rounded-md border bg-black/70 text-white shadow-lg backdrop-blur-md transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF0000] ${
            exitHint
              ? "exit-fullscreen-hint border-[#FF0000]"
              : "border-white/20 hover:border-[#FF0000] hover:bg-black/85"
          }`}
        >
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/** Overscroll prompt when the monitor holds scroll — Space or click to leave. */
function MonitorEdgeHint({ edge }) {
  const [side, setSide] = useState(edge);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (edge) {
      setSide(edge);
      const id = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(id);
    }
    setVisible(false);
    return undefined;
  }, [edge]);

  useEffect(() => {
    if (edge || !side) return undefined;
    const timer = window.setTimeout(() => setSide(null), 220);
    return () => window.clearTimeout(timer);
  }, [edge, side]);

  if (!side) return null;
  const atTop = side === "top";
  const label = atTop ? "Press Space or click to go back" : "Press Space or click to continue";
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-30 flex h-11 items-center justify-center transition-opacity duration-200 ease-out ${
        atTop
          ? "top-0 bg-gradient-to-b from-[#FF0000]/30 to-transparent"
          : "bottom-0 bg-gradient-to-t from-[#FF0000]/30 to-transparent"
      } ${visible ? "opacity-100" : "opacity-0"}`}
      role="status"
      aria-live="polite"
    >
      <span className={`text-[10px] font-medium tracking-wide text-white/85 ${atTop ? "mt-1 self-start" : "mb-1 self-end"}`}>
        {label}
      </span>
    </div>
  );
}

function ClickMarks({ marks }) {
  if (!marks.length) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true">
      {marks.map((mark) => (
        <span
          key={mark.id}
          className="click-mark"
          style={{ left: mark.x, top: mark.y }}
        />
      ))}
    </div>
  );
}

function ExperienceChoiceDialog({ onChoose3d, onChooseStatic }) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-[52] flex items-center justify-center bg-black/55 px-5 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="experience-choice-title">
      <div className="w-full max-w-md border border-white/15 bg-black/90 p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <p className="font-mono text-[10px] uppercase tracking-[.22em] text-white/45">Desktop</p>
        <h2 id="experience-choice-title" className="mt-3 text-2xl font-semibold tracking-[-.03em]">
          How do you want to view this site?
        </h2>
        <div className="mt-6 grid gap-2.5">
          <button
            type="button"
            onClick={onChoose3d}
            className="border border-[#FF0000]/70 bg-[#FF0000]/15 px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-[#FF0000]/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF0000]"
          >
            3D scene
          </button>
          <button
            type="button"
            onClick={onChooseStatic}
            className="border border-white/20 bg-white/5 px-4 py-3 text-left text-sm text-white/85 transition hover:border-white/40 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF0000]"
          >
            Static site
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ScrollStory() {
  const { timeline, site, loading, error } = useContent();
  const rootRef = useRef();
  const overlayRef = useRef(null);
  const lastProjectButton = useRef();
  const monitorScrollControllerRef = useRef(null);
  const lockedScrollYRef = useRef(0);
  const introStartedRef = useRef(false);
  // Ignore duplicate Esc / Desk-view while an overlay exit is already animating.
  const exitInFlightRef = useRef(false);
  // In-memory only for this page load — hard refresh shows the prompt again.
  const experiencePref = useRef(null);
  // True when fullscreen was opened from the 3D monitor beat (not the landing overlay).
  const openedFromStoryRef = useRef(false);
  // Crossfade waits until the desk/monitor shell has loaded under the overlay.
  const pendingIntroRef = useRef(false);
  const [phase, setPhase] = useState(1);
  const [storyProgress, setStoryProgress] = useState(0);
  const [cardFace, setCardFace] = useState("front");
  const [modalProject, setModalProject] = useState(null);
  // Land on the projects-site monitor canvas fullscreen by default.
  const [monitorFullscreen, setMonitorFullscreen] = useState(true);
  const [showSiteOverlay, setShowSiteOverlay] = useState(true);
  const [introPhase, setIntroPhase] = useState(null);
  const [askExperience, setAskExperience] = useState(false);
  const askExperienceRef = useRef(false);
  askExperienceRef.current = askExperience;
  // Mount WebGL only after the static portfolio has had network priority (or on 3D intent).
  const [sceneEnabled, setSceneEnabled] = useState(false);
  const [shellReady, setShellReady] = useState(false);
  // Polaroid + camera GLTFs (camera.bin is large): desktop after shell warm; mobile after story entry.
  const [heavyPropsEnabled, setHeavyPropsEnabled] = useState(false);
  const [exitHint, setExitHint] = useState(false);
  const [monitorEdgeHint, setMonitorEdgeHint] = useState(null); // "top" | "bottom" | null
  // True only during the timeline monitor hold beat (not the letter-approach pan).
  const [monitorHoldActive, setMonitorHoldActive] = useState(false);
  // Locked = hold at list edges until Space / click leave.
  // Desktop: re-arms whenever the monitor hold beat is entered from either direction.
  const [monitorScrollLocked, setMonitorScrollLocked] = useState(false);
  const [clickMarks, setClickMarks] = useState([]);
  const exitHintTimerRef = useRef(null);
  const clickMarkIdRef = useRef(0);
  const monitorHoldActiveRef = useRef(monitorHoldActive);
  monitorHoldActiveRef.current = monitorHoldActive;
  const monitorScrollLockedRef = useRef(monitorScrollLocked);
  monitorScrollLockedRef.current = monitorScrollLocked;
  const monitorEdgeHintRef = useRef(monitorEdgeHint);
  monitorEdgeHintRef.current = monitorEdgeHint;
  // After landing on the monitor, ignore edge-hint claims until the entry flick dies /
  // the list controller is ready (hard scrolls were flashing top/bottom hints mid-list).
  const holdEnterGraceUntilRef = useRef(0);
  const wheelSoftCapRef = useRef({ lastWheelAt: 0 });
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isDesktop = useMediaQuery("(hover: hover) and (pointer: fine) and (min-width: 900px)");
  const isDesktopRef = useRef(isDesktop);
  isDesktopRef.current = isDesktop;
  const [webgl] = useState(hasWebGL);
  const data = useMemo(() => createStoryData(timeline, site), [timeline, site]);
  const inIntro = Boolean(introPhase);
  const cameraViewActive = !showSiteOverlay && !inIntro;
  // Pin the 3D camera to the monitor while the DOM portfolio covers it, so reveal never flashes the card.
  const holdMonitorCamera = showSiteOverlay || introPhase === "pin-monitor";
  const openProject = useCallback((project, trigger) => { lastProjectButton.current = trigger; setModalProject(project); }, []);
  const closeProject = useCallback(() => { setModalProject(null); requestAnimationFrame(() => lastProjectButton.current?.focus()); }, []);
  const setMonitorScrollController = useCallback((controller) => {
    monitorScrollControllerRef.current = controller;
  }, []);

  // Sync hold/lock refs immediately. Never scrollTo from this path — it runs from
  // ScrollTrigger onUpdate and was corrupting scrub (slingshot to chapter 1).
  const onMonitorHoldActiveChange = useCallback((active) => {
    monitorHoldActiveRef.current = active;
    if (active) {
      holdEnterGraceUntilRef.current = performance.now() + 380;
      monitorEdgeHintRef.current = null;
      setMonitorEdgeHint(null);
      if (isDesktopRef.current) {
        monitorScrollLockedRef.current = true;
        setMonitorScrollLocked(true);
      }
    } else {
      holdEnterGraceUntilRef.current = 0;
      monitorEdgeHintRef.current = null;
      setMonitorEdgeHint(null);
    }
    setMonitorHoldActive(active);
  }, []);

  // Unlock and step just past the hold edge (user gesture — safe to scrollTo here).
  const leaveMonitorScroll = useCallback((edge) => {
    monitorEdgeHintRef.current = null;
    monitorScrollLockedRef.current = false;
    setMonitorScrollLocked(false);
    setMonitorEdgeHint(null);

    const epsilon = 0.001;
    if (edge === "top") {
      const monitorProgress = storyProgressForLabel("monitor");
      if (monitorProgress != null) {
        scrollToStoryProgress(Math.max(0, monitorProgress - epsilon));
        return;
      }
    }
    const letterApproachProgress = storyProgressForLabel("letter-approach");
    if (letterApproachProgress != null) {
      scrollToStoryProgress(Math.min(1, letterApproachProgress + epsilon));
      return;
    }
    window.scrollBy(0, edge === "top" ? -48 : 48);
  }, []);

  const spawnClickMark = useCallback((clientX, clientY) => {
    const id = clickMarkIdRef.current + 1;
    clickMarkIdRef.current = id;
    // Cursor hotspot is the tip (top-left of the custom arrow) — mark sits on that point.
    setClickMarks((prev) => [...prev, { id, x: clientX, y: clientY }]);
    window.setTimeout(() => {
      setClickMarks((prev) => prev.filter((mark) => mark.id !== id));
    }, 420);
  }, []);

  const flashExitHint = useCallback(() => {
    setExitHint(true);
    clearTimeout(exitHintTimerRef.current);
    exitHintTimerRef.current = setTimeout(() => setExitHint(false), 650);
  }, []);

  useEffect(() => () => {
    clearTimeout(exitHintTimerRef.current);
    if (overlayRef.current) gsap.killTweensOf(overlayRef.current);
  }, []);

  // Ask desktop visitors once per page load (in-memory).
  useEffect(() => {
    if (reducedMotion || !webgl) return undefined;
    if (experiencePref.current === "static" || experiencePref.current === "3d") {
      setAskExperience(false);
      return undefined;
    }
    if (isDesktop) setAskExperience(true);
    return undefined;
  }, [isDesktop, reducedMotion, webgl]);

  const onIntroComplete = useCallback(() => {
    introStartedRef.current = false;
    exitInFlightRef.current = false;
    monitorHoldActiveRef.current = false;
    setMonitorHoldActive(false);
    setMonitorScrollLocked(false);
    setMonitorEdgeHint(null);
    setIntroPhase(null);
    setPhase(1);
    setStoryProgress(0);
    setCardFace("front");
  }, []);

  // Fade the DOM portfolio out over the live 3D canvas (monitor already framed underneath).
  const crossfadeOverlayOut = useCallback((onComplete) => {
    const overlay = overlayRef.current;
    if (overlay) gsap.killTweensOf(overlay);
    // Reveal the in-scene monitor UI under the fading fullscreen portfolio.
    setMonitorFullscreen(false);

    requestAnimationFrame(() => {
      if (!overlay) {
        onComplete();
        return;
      }
      overlay.style.pointerEvents = "none";
      gsap.to(overlay, {
        opacity: 0,
        duration: INTRO_CROSSFADE_DURATION,
        ease: "power2.inOut",
        onComplete,
      });
    });
  }, []);

  const runIntroCrossfade = useCallback(() => {
    crossfadeOverlayOut(() => {
      setShowSiteOverlay(false);
      setIntroPhase("zoom-out");
    });
  }, [crossfadeOverlayOut]);

  const handleMonitorReady = useCallback(() => {
    setShellReady(true);
    ScrollTrigger.refresh();
    if (pendingIntroRef.current) {
      pendingIntroRef.current = false;
      runIntroCrossfade();
    }
  }, [runIntroCrossfade]);

  // After static portfolio textures settle, warm the desk/monitor shell.
  // Desktop also starts fetching every 3D GLTF (incl. camera.bin) in parallel.
  useEffect(() => {
    if (reducedMotion || !webgl) return undefined;
    if (!showSiteOverlay) return undefined;
    let cancelled = false;
    let idleId;
    let timeoutId;

    const warm = () => {
      if (cancelled || experiencePref.current === "static") return;
      const desktop = isDesktopRef.current;
      preloadStoryAssets({ heavy: desktop });
      setSceneEnabled(true);
    };

    const start = async () => {
      // Two frames so Portfolio can commit its <img>s into the overlay.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (cancelled) return;
      await whenImagesSettled(overlayRef.current);
      if (cancelled || experiencePref.current === "static") return;
      if (typeof requestIdleCallback === "function") {
        idleId = requestIdleCallback(warm, { timeout: 800 });
      } else {
        timeoutId = window.setTimeout(warm, 200);
      }
    };
    start();

    return () => {
      cancelled = true;
      if (idleId != null) window.cancelIdleCallback?.(idleId);
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [reducedMotion, showSiteOverlay, webgl]);

  // Story-face fonts + stamp only when the 3D shell is actually mounting (not on static landing).
  useEffect(() => {
    if (!sceneEnabled) return undefined;
    ensureStoryFonts();
    const stamp = new Image();
    stamp.decoding = "async";
    stamp.src = "/assets/stamp.webp";
    return undefined;
  }, [sceneEnabled]);

  // Heavy GLTFs (camera.bin + polaroid): desktop mounts once the shell is ready
  // under the overlay; mobile still waits until the scroll story is active.
  useEffect(() => {
    if (!sceneEnabled || !shellReady) return undefined;
    if (isDesktop) {
      preloadStoryAssets({ heavy: true });
      setHeavyPropsEnabled(true);
      return undefined;
    }
    if (showSiteOverlay || introPhase) return undefined;
    const enableHeavy = () => setHeavyPropsEnabled(true);
    let idleId;
    let timeoutId;
    if (typeof requestIdleCallback === "function") {
      idleId = requestIdleCallback(enableHeavy, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(enableHeavy, 400);
    }
    return () => {
      if (idleId != null) window.cancelIdleCallback?.(idleId);
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [introPhase, isDesktop, sceneEnabled, shellReady, showSiteOverlay]);

  // Pin monitor under the DOM portfolio, crossfade the overlay away, then pan to card 1.
  const beginExperienceIntro = useCallback(() => {
    if (introStartedRef.current) return;
    introStartedRef.current = true;
    exitInFlightRef.current = true;
    openedFromStoryRef.current = false;
    monitorHoldActiveRef.current = false;
    setMonitorHoldActive(false);
    setMonitorScrollLocked(false);
    setMonitorEdgeHint(null);
    setAskExperience(false);
    setExitHint(false);
    lockedScrollYRef.current = 0;
    setPhase(1);
    setStoryProgress(0);
    setCardFace("front");
    setIntroPhase("pin-monitor");
    // Choosing 3D early: pull in the full asset set (desktop includes camera.bin).
    preloadStoryAssets({ heavy: isDesktopRef.current });
    setSceneEnabled(true);
    if (isDesktopRef.current) setHeavyPropsEnabled(true);

    if (shellReady) {
      runIntroCrossfade();
    } else {
      pendingIntroRef.current = true;
    }
  }, [runIntroCrossfade, shellReady]);

  const choose3d = useCallback(() => {
    experiencePref.current = "3d";
    askExperienceRef.current = false;
    setAskExperience(false);
    beginExperienceIntro();
  }, [beginExperienceIntro]);

  const chooseStatic = useCallback(() => {
    experiencePref.current = "static";
    askExperienceRef.current = false;
    setAskExperience(false);
    pendingIntroRef.current = false;
    setSceneEnabled(false);
    setShellReady(false);
    setHeavyPropsEnabled(false);
  }, []);

  // Crossfade back to the 3D monitor framing the user came from (no chapter-1 intro).
  const restoreStoryFullscreenExit = useCallback(() => {
    setExitHint(false);
    askExperienceRef.current = false;
    setAskExperience(false);
    window.scrollTo(0, lockedScrollYRef.current);
    setSceneEnabled(true);

    crossfadeOverlayOut(() => {
      setShowSiteOverlay(false);
      exitInFlightRef.current = false;
      const storyTrigger = getStoryScrollTrigger();
      storyTrigger?.enable(true);
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        ScrollTrigger.update();
        storyTrigger?.getTween()?.progress(1);
      });
    });
  }, [crossfadeOverlayOut]);

  const exitMonitorFullscreen = useCallback(() => {
    // Prompt still open — Esc means static, never the 3D intro.
    if (askExperienceRef.current) {
      chooseStatic();
      return;
    }
    // Double Esc / Desk-view during the crossfade must not start the card intro
    // after a monitor restore already cleared openedFromStoryRef.
    if (exitInFlightRef.current || introStartedRef.current) return;

    exitInFlightRef.current = true;
    // Returning from the static fullscreen site → unlocked so scroll can leave the monitor.
    monitorScrollLockedRef.current = false;
    setMonitorScrollLocked(false);
    setMonitorEdgeHint(null);
    // Opened from the 3D story → crossfade back to the current monitor beat.
    if (openedFromStoryRef.current) {
      openedFromStoryRef.current = false;
      restoreStoryFullscreenExit();
      return;
    }
    // Landing / first exit after a decision → crossfade then pan to card 1.
    if (!experiencePref.current) experiencePref.current = "3d";
    beginExperienceIntro();
  }, [beginExperienceIntro, chooseStatic, restoreStoryFullscreenExit]);

  const enterMonitorFullscreen = useCallback(() => {
    exitInFlightRef.current = false;
    openedFromStoryRef.current = true;
    lockedScrollYRef.current = window.scrollY;
    setShowSiteOverlay(true);
    setMonitorFullscreen(true);
    askExperienceRef.current = false;
    setAskExperience(false);
    requestAnimationFrame(() => {
      const overlay = overlayRef.current;
      if (!overlay) return;
      gsap.killTweensOf(overlay);
      overlay.style.pointerEvents = "auto";
      gsap.set(overlay, { opacity: 1 });
    });
  }, []);

  // Freeze page scroll + ScrollTrigger while the overlay or intro owns the view.
  // Do not pin body with position:fixed — that unsticks/replaces the viewport canvas
  // and flashes a second non-interactive story frame at document top.
  useEffect(() => {
    if (!showSiteOverlay && !inIntro) return undefined;
    const storyTrigger = ScrollTrigger.getById("portfolio-story");
    storyTrigger?.disable(false);
    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverscroll: body.style.overscrollBehavior,
      scrollY: lockedScrollYRef.current,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";
    const lockScroll = () => {
      if (window.scrollY !== lockedScrollYRef.current) {
        window.scrollTo(0, lockedScrollYRef.current);
      }
    };
    const blockPageWheel = (event) => {
      if (inIntro) {
        event.preventDefault();
        return;
      }
      if (!event.target?.closest?.("[data-monitor-fullscreen]")) {
        event.preventDefault();
      }
    };
    const blockTouchScroll = (event) => {
      if (inIntro) {
        event.preventDefault();
        return;
      }
      if (!event.target?.closest?.("[data-monitor-fullscreen]")) {
        event.preventDefault();
      }
    };
    window.addEventListener("scroll", lockScroll, { passive: false });
    window.addEventListener("wheel", blockPageWheel, { passive: false, capture: true });
    window.addEventListener("touchmove", blockTouchScroll, { passive: false, capture: true });
    return () => {
      window.removeEventListener("scroll", lockScroll);
      window.removeEventListener("wheel", blockPageWheel, { capture: true });
      window.removeEventListener("touchmove", blockTouchScroll, { capture: true });
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      html.style.overscrollBehavior = previous.htmlOverscroll;
      body.style.overscrollBehavior = previous.bodyOverscroll;
      window.scrollTo(0, previous.scrollY);
      // ScrollTrigger is re-enabled by intro completion or restoreStoryFullscreenExit.
    };
  }, [inIntro, showSiteOverlay]);

  // Single Esc path: while the prompt is up → static; after a decision → leave fullscreen / enter 3D.
  // Nested project modals own Escape — only exit the site overlay when none are open.
  useEffect(() => {
    if (!showSiteOverlay || inIntro) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (document.querySelector("[data-project-modal]")) return;
      event.preventDefault();
      event.stopPropagation();
      if (askExperienceRef.current) {
        chooseStatic();
        return;
      }
      exitMonitorFullscreen();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [chooseStatic, exitMonitorFullscreen, inIntro, showSiteOverlay]);

  // F expands the in-scene monitor into the fullscreen site.
  useEffect(() => {
    if (showSiteOverlay || inIntro || !monitorHoldActive) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "f" && event.key !== "F") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.repeat) return;
      if (event.target?.closest?.("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      enterMonitorFullscreen();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enterMonitorFullscreen, inIntro, monitorHoldActive, showSiteOverlay]);

  // Space or click leaves the monitor hold once an edge prompt is showing.
  useEffect(() => {
    if (!isDesktop || showSiteOverlay || inIntro || !monitorHoldActive || !monitorScrollLocked) return undefined;

    const canLeave = () => Boolean(monitorEdgeHintRef.current);

    const onKeyDown = (event) => {
      if (event.code !== "Space" && event.key !== " ") return;
      if (event.repeat) return;
      if (event.target?.closest?.("input, textarea, select, [contenteditable='true']")) return;
      if (!canLeave()) return;
      event.preventDefault();
      leaveMonitorScroll(monitorEdgeHintRef.current);
    };

    const onPointerDown = (event) => {
      if (event.button !== 0) return;
      if (!canLeave()) return;
      if (event.target?.closest?.("a, button, input, textarea, select, label, [role='button'], [role='slider']")) return;
      leaveMonitorScroll(monitorEdgeHintRef.current);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [inIntro, isDesktop, leaveMonitorScroll, monitorHoldActive, monitorScrollLocked, showSiteOverlay]);

  // Every primary press gets a small mark at the cursor tip (hotspot).
  useEffect(() => {
    if (!isDesktop) return undefined;
    const onPointerDown = (event) => {
      if (event.button !== 0) return;
      spawnClickMark(event.clientX, event.clientY);
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [isDesktop, spawnClickMark]);

  // Soft-cap story scrub. On the monitor hold: list scroll; at edges, Space/click prompt.
  // Crossing into the hold clamps onto the near edge (user-gesture scrollTo only — never
  // from ScrollTrigger onUpdate, which was slingshotting the camera to chapter 1).
  useEffect(() => {
    if (showSiteOverlay || inIntro || !isDesktop) return undefined;

    const softCap = wheelSoftCapRef.current;

    const normalizeDelta = (event) => {
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      return event.deltaY * scale;
    };

    const applyCappedStoryScroll = (event, rawDelta) => {
      const now = performance.now();
      const dt = softCap.lastWheelAt ? Math.min(48, Math.max(8, now - softCap.lastWheelAt)) : 16;
      softCap.lastWheelAt = now;
      event.preventDefault();
      event.stopImmediatePropagation();
      const raw = rawDelta ?? normalizeDelta(event);
      if (!raw) return;
      const step = Math.sign(raw) * Math.min(Math.abs(raw), STORY_WHEEL_MAX_DELTA, STORY_WHEEL_MAX_SPEED * dt);

      if (!monitorHoldActiveRef.current) {
        const trigger = getStoryScrollTrigger();
        const monitorP = storyProgressForLabel("monitor");
        const letterP = storyProgressForLabel("letter-approach");
        if (trigger && monitorP != null && letterP != null) {
          const span = trigger.end - trigger.start;
          const current = trigger.progress;
          const next = current + (span > 0 ? step / span : 0);
          // From below (3→4): land just inside the hold start.
          if (step > 0 && current < monitorP && next >= monitorP) {
            holdEnterGraceUntilRef.current = performance.now() + 380;
            scrollToStoryProgress(Math.min(letterP - 0.0005, monitorP + 0.001));
            return;
          }
          // From above (5→4): land just inside the hold end.
          if (step < 0 && current >= letterP && next < letterP) {
            holdEnterGraceUntilRef.current = performance.now() + 380;
            scrollToStoryProgress(Math.max(monitorP + 0.0005, letterP - 0.001));
            return;
          }
        }
      }

      window.scrollBy(0, step);
    };

    const onWheel = (event) => {
      if (!monitorHoldActiveRef.current) {
        setMonitorEdgeHint((prev) => (prev == null ? prev : null));
        applyCappedStoryScroll(event);
        return;
      }

      const raw = normalizeDelta(event);
      const dir = Math.sign(raw) || Math.sign(event.deltaY);
      if (!dir) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      const controller = monitorScrollControllerRef.current;
      // List controller mounts a frame after hold becomes interactive — absorb
      // leftover entry-flick deltas without pretending we're at an edge.
      if (!controller) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      const consumed = controller(event.deltaY, event.deltaMode);
      if (consumed) {
        setMonitorEdgeHint((prev) => (prev == null ? prev : null));
        softCap.lastWheelAt = performance.now();
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      // At list edge while locked — prompt and absorb until Space / click.
      if (monitorScrollLockedRef.current) {
        // Still coasting from the 3→4 / 5→4 flick — don't flash the leave hint.
        if (performance.now() < holdEnterGraceUntilRef.current) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
        const edge = dir < 0 ? "top" : "bottom";
        if (monitorEdgeHintRef.current !== edge) {
          monitorEdgeHintRef.current = edge;
          setMonitorEdgeHint(edge);
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      setMonitorEdgeHint((prev) => (prev == null ? prev : null));
      applyCappedStoryScroll(event, raw);
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      setMonitorEdgeHint(null);
    };
  }, [inIntro, isDesktop, showSiteOverlay]);

  // Clear edge UI when leaving the hold beat (lock re-arm is handled sync in onMonitorHoldActiveChange).
  useEffect(() => {
    if (monitorHoldActive) return;
    setMonitorEdgeHint(null);
  }, [monitorHoldActive]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">Loading portfolio…</div>;
  if (reducedMotion || !webgl) return <><StaticPortfolioFallback data={data} reason={reducedMotion ? "Reduced-motion view enabled." : "Interactive 3D is unavailable in this browser."} onOpenProject={openProject} /><ProjectModal project={modalProject} isOpen={Boolean(modalProject)} onClose={closeProject} /></>;
  // Track height alone drives scrub length. The WebGL layer stays position:fixed so
  // scroll lock / overlay / intro never swap in a second canvas at document top.
  const storyChromeVisible = !showSiteOverlay && !inIntro;
  // Remap scrub progress onto evenly spaced chapter dots so lock holds park on the
  // circle and journeys fill the line between them (no overshoot past the next lock).
  const navProgress = storyProgressToNavProgress(storyProgress);
  return <main ref={rootRef} className="scroll-story relative h-[500vh] bg-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    <div className="fixed inset-0 z-0 h-dvh overflow-hidden">
      {sceneEnabled && (
        <StoryCanvas
          data={data}
          phase={phase}
          cardFace={cardFace}
          rootRef={rootRef}
          setPhase={setPhase}
          setStoryProgress={setStoryProgress}
          setCardFace={setCardFace}
          setMonitorHoldActive={onMonitorHoldActiveChange}
          onMonitorReady={handleMonitorReady}
          onMonitorScrollControllerChange={setMonitorScrollController}
          monitorTuning={DEFAULT_MONITOR_TUNING}
          cameraViewActive={cameraViewActive}
          monitorFullscreen={monitorFullscreen}
          holdMonitorCamera={holdMonitorCamera}
          introPhase={introPhase}
          onIntroComplete={onIntroComplete}
          monitorEdgeHint={monitorEdgeHint}
          monitorHoldActive={monitorHoldActive}
          heavyPropsEnabled={heavyPropsEnabled}
        />
      )}
      {storyChromeVisible && <StoryProgressNav phase={phase} progress={navProgress} />}
      {storyChromeVisible && <p className="pointer-events-none absolute bottom-5 left-5 rounded bg-slate-950/90 px-3 py-2 text-xs text-white/80">Scroll to explore</p>}
      {storyChromeVisible && error && <p className="pointer-events-none absolute bottom-5 right-5 max-w-xs text-right text-xs text-white/60">Showing bundled portfolio content.</p>}
      {storyChromeVisible && <p className="pointer-events-none absolute bottom-5 right-5 translate-y-6 text-[9px] text-white/40">Monitor: portgl16 · Polaroid: edoardogalati · Camera: Boxroom_3D · CC BY 4.0</p>}
      {(monitorHoldActive && storyChromeVisible) && (
        <MonitorChromeControls
          fullscreen={false}
          onToggleFullscreen={enterMonitorFullscreen}
          hint="Expand site"
          shortcut="F"
        />
      )}
    </div>
    {showSiteOverlay && (
      <div ref={overlayRef} data-monitor-fullscreen className="pointer-events-auto fixed inset-0 z-50 h-dvh bg-black" role="dialog" aria-modal="true" aria-label="Projects site">
        <Portfolio mode="fullscreen" className="h-full" onBottomOverscroll={flashExitHint} />
        {!askExperience && (
          <MonitorChromeControls
            fullscreen
            onToggleFullscreen={exitMonitorFullscreen}
            exitHint={exitHint}
            shortcut="Esc"
          />
        )}
        {askExperience && <ExperienceChoiceDialog onChoose3d={choose3d} onChooseStatic={chooseStatic} />}
        {introPhase === "pin-monitor" && !shellReady && (
          <div className="pointer-events-none absolute inset-x-0 bottom-10 z-[60] flex justify-center">
            <p className="rounded bg-black/80 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/80">
              Loading 3D scene…
            </p>
          </div>
        )}
      </div>
    )}
    <ClickMarks marks={clickMarks} />
    {STORY_CHAPTERS.map((chapter) => <span key={chapter.id} id={chapter.id} aria-hidden="true" className="pointer-events-none absolute left-0 h-px w-px" style={{ top: `${chapter.markerProgress * 500}vh` }} />)}
    {STORY_CHAPTERS.map((chapter, index) => (
      <section key={chapter.timelineLabel} className="sr-only" aria-label={`Story chapter ${index + 1}: ${chapter.timelineLabel}`} />
    ))}
  </main>;
}
