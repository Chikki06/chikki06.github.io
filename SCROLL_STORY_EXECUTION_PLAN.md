# ScrollStory 3D Portfolio Overhaul — Execution Plan

## Outcome

Replace the current public-page `ScrollStory` prototype with a polished, four-phase, desk-based portfolio narrative. The public route remains `ScrollStory`; `/admin` and `src/hooks/useContent.js` remain untouched. Every portfolio value shown by the new experience is derived from `useContent()`'s `timeline` and `site` values.

This is an execution plan only. It intentionally does not implement the overhaul.

## Workspace findings

| Area | Current state | Planning consequence |
| --- | --- | --- |
| Runtime | React 19.2, R3F 9, Drei 10.7, GSAP 3.13, Three 0.179, and Tailwind 4.1 are already installed. | No dependency installation is required for the core build. |
| Public route | `src/App.jsx` already sends all non-`/admin` paths to `ScrollStory`. | Retain this route decision and do not alter its `/admin` branch. |
| Content source | `useContent()` returns the development JSON API result or bundled fallback JSON. | `ScrollStory` calls it once and passes a normalized view model down; no direct JSON imports in new 3D components. |
| Existing story | `src/components/ScrollStory.jsx` is a 125-line proof of concept: it has a fixed 42° camera, a simple `800vh` trigger, uncalibrated model-screen plane, an abbreviated timeline, selected-card flip state, and rough envelope HTML. | Refactor it into an orchestration root plus focused scene/UI modules rather than layering more behavior into the current file. |
| Modal | `ProjectModal.jsx` already renders the rich detailed project content and handles Escape / focus-independent close behavior. The legacy `Portfolio.jsx` opens it via `modalProject` state. | Reuse it from `ScrollStory` as a canvas sibling; monitor card clicks set the same selected project state. |
| Content | `content/timeline.json` currently has 8 entries (2 careers, 1 education, 5 projects). All 5 projects have `project` metadata, but none declares project video/image/poster media. | The monitor must render all five projects with a stable visual fallback; do not depend on nonexistent video fields. |
| Monitor asset | The supplied file is `public/assets/monitor/scene.gltf` with `scene.bin` and its texture, not `public/monitor.gltf`. It is CC-BY-4.0 and attributes Sketchfab author `portgl16`. | Load `/assets/monitor/scene.gltf`, retain visible attribution in the non-canvas/final credits, and calibrate against the actual mesh. |
| Monitor geometry | Raw model bounds are roughly 18.32 × 3.85 × 13.10 world units. Its named display mesh is `Cube_RenderMonitor_0`. | Add a one-time calibration pass to establish the display surface transform, rather than retaining the current guessed screen dimensions/offset. |
| Art assets | `table.jpg` (~12.7 MB), `card.jpg` (~3.1 MB), `stamp.jpg` (~2.1 MB), and handwritten SVGs already exist. | Compress/downsample the raster textures before launch; use the vector handwriting paths for stroke animation. Do not use fire videos as project previews. |

## Non-negotiable architecture

1. Do not edit `src/hooks/useContent.js`, its bundled-data fallback, the Vite admin API, or `/admin` routing.
2. Keep `src/components/ScrollStory.jsx` as the public root. It owns loading/error/fallback decisions, the selected project state, the modal state, and the normalized `storyData` object only.
3. All user-visible copy, links, buttons, cards, labels, and scene-attached UI use Drei `<Html>`. Do not introduce canvas text for interface copy.
4. Use GSAP's registered `ScrollTrigger` and a single, scoped master timeline. Never derive story progress from `window.scrollY` or document height.
5. Use `useThree((state) => state.viewport)` in the camera/layout controller. The card, timeline, monitor, and envelope are sized from the live viewport rather than fixed desktop-only scales.
6. Keep the Canvas pinned only during the story. DOM used inside `<Html>` must be allowed to receive pointer input; decorative chapter labels remain `pointer-events-none`.
7. Preserve the existing detailed-project path by rendering `ProjectModal` outside the canvas but within `ScrollStory`; it must be opened by native buttons in monitor `<Html>` cards.

## Recommended component boundaries

| File / unit | Responsibility |
| --- | --- |
| `ScrollStory.jsx` | Calls `useContent`, creates the data view model, selects loading/error/static fallback, owns `modalProject`, composes the document chapters, canvas, and existing `ProjectModal`. |
| `storyData.js` | Pure, defensive selectors for hero/contact/socials, all timeline entries, projects, and asset fallback. It has no React or Three imports. |
| `StoryCanvas.jsx` | Canvas settings, lights, environment, desk group, suspense/error boundaries, and scene composition. No business copy. |
| `StoryCameraRig.jsx` | Reads `useThree(...viewport)`, computes responsive camera/object metrics, follows the GSAP camera target, and exposes calibrated anchors. |
| `useScrollStoryTimeline.js` | Registers one `gsap.context`, creates/cleans up the master timeline and `ScrollTrigger`, publishes an optional chapter index, and refreshes after model/HTML layout readiness. |
| `BusinessCard.jsx` | Desk-relative two-sided cream card geometry, its front/back `<Html transform>` containers, and card transform refs. |
| `TimelineBack.jsx` | Compact but complete, accessible timeline treatment derived from all nodes; it owns internal scrolling when the back is zoomed into view. |
| `Monitor.jsx` / `MonitorScreen.jsx` | Loads and calibrates the GLTF; supplies a physical screen/backing surface plus the `<Html transform occlude>` project page. |
| `MonitorProjectCard.jsx` | Opaque project card UI, native click/keyboard behavior, link propagation rules, and modal callback. |
| `Envelope.jsx` / `EnvelopeContact.jsx` | Slanted envelope geometry plus tightly composed, semantic HTML contact face and decorative handwriting SVG paths. |
| `StaticPortfolioFallback.jsx` | Semantic, non-WebGL/reduced-motion version of hero, timeline, project cards/modal access, and contact links. |

## Step-by-step execution

### 1. Preserve the baseline and define acceptance fixtures

1. Record the current production build result and screenshot the existing desktop and mobile public route before editing.
2. Treat current uncommitted changes as user-owned; do not reset or discard them. Work only in the story-related files identified above.
3. Make a small fixture checklist from the actual JSON: empty hero tagline, five projects, links-only projects (`hasDetails: false`), and rich projects (`hasDetails: true`). The new UI must remain resilient to missing optional data.
4. Establish target test viewports: 360×800, 390×844, 768×1024, 1440×900, and a short-height desktop viewport. Include keyboard-only and reduced-motion tests.

### 2. Normalize content at the root

1. In `ScrollStory`, call `useContent()` exactly once. While loading, render a semantic loading state; when it returns an error, keep the JSON fallback content usable and show a non-blocking notice only if appropriate.
2. Create a memoized view model from returned data:
   - card front: `site.hero`, contact email, and social URLs;
   - timeline back: every valid timeline node, preserving JSON order and grouping/displaying year/type safely;
   - monitor: every node with `type === "project"` and a `project` object;
   - envelope: email, GitHub social, LinkedIn social, then any remaining socials.
3. Use safe fallbacks for absent title, date, summary, links, and tags. Do not encode portfolio text, IDs, social URLs, or project lists as 3D component constants.
4. Keep `modalProject` in `ScrollStory`. Pass an `onOpenProject(project)` callback to the monitor screen; render the existing `ProjectModal` with this state as a sibling above the canvas. Links inside cards remain anchors and should stop propagation so they do not accidentally open the modal.

### 3. Build the document and scroll contract

1. Create one story container with a pinned canvas and four explicit semantic chapter markers. Give each phase its own scroll allocation rather than a single opaque `h-[800vh]` block.
2. Use a master GSAP timeline whose labels correspond to: `card-overhead`, `card-lift`, `timeline-read`, `monitor`, and `envelope`. Each chapter marker provides stable `ScrollTrigger` range boundaries.
3. Create the timeline in `useLayoutEffect` only in the browser, wrapped in `gsap.context` scoped to the story root. On teardown, revert the context so hot reload/navigation does not leave triggers or inline transforms behind.
4. Set `scrub` for direct scroll control, `invalidateOnRefresh: true`, and call `ScrollTrigger.refresh()` only after the GLTF and the relevant HTML measurements are ready. Respect resize/orientation changes through `ScrollTrigger` refresh rather than manually maintaining page-height math.
5. Avoid per-frame React state updates for scroll progress. GSAP mutates Three object refs/camera target values; React state changes only at chapter boundaries if a label or accessibility announcement needs them.

### 4. Establish responsive camera and safe framing

1. In `StoryCameraRig`, read `viewport.width`, `viewport.height`, `viewport.aspect`, `size.width`, and `size.height` using `useThree((state) => state.viewport)` (with the remaining fields from `useThree` only if needed).
2. Choose one camera FOV range, for example approximately 35–50°, clamped by aspect ratio. Use a narrower FOV on tall/narrow screens where the scene needs more vertical desk context and a wider FOV only where necessary on desktop. Update camera projection matrix after FOV changes.
3. Derive visual scale from the viewport at the relevant focal depth. For an object of width `w` and desired horizontal occupancy `r`, calculate a safe scale from `viewport.width * r / w`; cap it against vertical occupancy (`viewport.height * rY / h`). Use the smaller result. This prevents clipping on either axis.
4. Define explicit safe occupancy targets, not magic scales:
   - overhead business card: 70–78% of the short viewport dimension; on mobile leave visibly more desk at the top and bottom;
   - timeline read state: 86–92% of usable viewport height with a 16–24 px visual safety margin;
   - monitor: screen frame 82–88% of viewport width and no more than 78% of height;
   - envelope: 58–68% of width, intentionally smaller than the monitor framing.
5. Recompute the target positions/scales on `viewport` changes before refreshing ScrollTrigger. Preserve the normalized phase progress so orientation changes do not jump the story to another chapter.
6. Centralize all calibrated camera positions, look-at targets, and responsive scale functions in one scene-layout configuration. Tune them with helpers/anchors visible only in development, then remove the helpers before release.

### 5. Phase 1 — overhead business card

1. Create a desk plane/low-volume desk group using the existing table texture, correctly color-managed and with modest roughness. The desk must extend beyond every camera frame and receive shadows.
2. Build a thin, cream, double-sided business card as a `group` with a small physical thickness. It rests just above the desk, with its pivot at its center so a flip is predictable.
3. Attach the front with `<Html transform center>` in the card's local space. It presents name, available hero tagline/subheader, email/social links, and a scroll affordance using real anchors/buttons where relevant.
4. Use a cream opaque backing behind the front HTML. Match its dimensions to the modeled card; use `overflow-hidden`, `border-radius`, and a fixed page-like aspect ratio so DOM does not spill past the physical card.
5. Start the camera directly over the card, looking straight down at its center. The mobile layout uses the responsive occupancy calculation, not a device-specific hard-coded scale.

### 6. Phase 2 — lift, flip, and readable timeline

1. Split the card transition into three separate master-timeline beats: lift, flip, and read. First translate the card upward along the scene's vertical/normal axis until its lowest corner fully clears the desk plus a small safety margin.
2. Only after the lift completes, rotate it exactly 180° around its local flip axis. Keep the card slightly elevated through the rotation; do not allow a corner to intersect the desk.
3. Then adjust camera target/distance and responsive card scale so the back is front-facing and fills the defined safe read area.
4. Put the timeline back in a separate `<Html transform center>` on the reverse face. Rotate its containing Three group so DOM is never visually mirrored when the physical card turns. Apply `backface-visibility: hidden` to both HTML faces and never overlap both faces at once.
5. Render all eight present timeline entries, grouped by year/type or in their authored order, in a constrained, semantic inner `overflow-y-auto` area. It must be readable without needing the whole page to continue scrolling while the user is inspecting the card.
6. During this chapter, temporarily capture wheel/touch scroll inside the timeline only when it can scroll further; at its top/bottom, allow normal document scroll to advance/reverse the story. Ensure keyboard scrolling and focusable links still work.

### 7. Phase 3 — monitor and projects

1. Load the GLTF with `useGLTF` under `Suspense`, keep the generated scene immutable per mounted canvas, and preload after initial route readiness. Use `Center` only during calibration; replace it with a known authored transform once screen anchors are verified.
2. Inspect `Cube_RenderMonitor_0` in the loaded scene and add a local screen anchor just in front of the visible display face. Confirm orientation in both the R3F inspector/dev helper and screenshots—its glTF source coordinate system cannot be inferred safely from the current guessed plane.
3. Give the monitor a physical, opaque screen mesh behind the DOM to prevent seeing through the panel. Use the asset's casing/monitor geometry as the occluder; do not set `depthWrite: false` on the frame/screen.
4. Animate camera target first up the desk, then camera position into the monitor. End with screen borders inside the responsive safe frame rather than camera zoom alone; its final dimensions must use the calculated viewport fit.
5. Mount a single `<Html transform occlude>` precisely on the calibrated screen anchor. The wrapper is a fixed virtual screen with `overflow-auto`, then scales through `distanceFactor`/the parent group. Avoid `Html fullscreen`.
6. Render all five project nodes as an internal responsive grid/list:
   - every card receives an explicit opaque `bg-white` or `bg-slate-900`, an opaque border/shadow, `isolation:isolate`, and positive z-index;
   - the screen wrapper itself also has an opaque background;
   - use `backface-visibility: hidden` on card faces and do not rely on transparent media overlay layers;
   - render title, subtitle/date, short description, tags, and links from JSON;
   - if a project later gains a direct media URL, use it; for today, use an intentional opaque gradient/image-free fallback, not the unrelated fire videos.
7. Card primary buttons call `onOpenProject(node.project)` to show the existing rich modal. A project with `hasDetails: false` still offers its native external link and does not misleadingly promise a detail modal.
8. Test the exact critical regression: scroll the monitor to positions where a card sits over a previously visible card-back area. No reversed/mirrored timeline text may show through the project cards.

### 8. Phase 4 — envelope and contact

1. Place the envelope at the lower-right desk area with a small, deliberate slant. Construct it as simple opaque paper panels/flap (or a compact static model) with a stable local face anchor; it does not need to compete in scale with the monitor.
2. Pan the camera down and right from the monitor, then float closer. End at the envelope's responsive 58–68% width target so it is legible but clearly a quieter final beat than the monitor.
3. Mount contact UI with `<Html transform>` on the envelope face. Its root has a fixed envelope aspect ratio, `overflow-hidden`, an opaque cream background, and tight CSS grid regions—return address top-left, stamp top-right, central addressee—to eliminate the existing excessive empty area.
4. Map content semantically:
   - central email is a `mailto:` link;
   - GitHub is the clickable stamp (prefer `stamp.jpg` as texture/artwork only if its link remains an actual anchor);
   - LinkedIn is the clickable return-address block;
   - render additional social URLs in a small labelled fallback row if they exist.
5. Do not use rasterized handwriting as the only interactive content. Inline the existing path-based handwriting SVGs (or create an accessible SVG component from them), mark decorative path copies `aria-hidden`, and keep a visually available text/anchor label for assistive technology.
6. On entry to the envelope chapter, obtain each SVG path length once, initialize `stroke-dasharray` and `stroke-dashoffset` to that length, then animate dashoffset to zero with a GSAP timeline. Scope/revert this nested timeline with the envelope component and re-run safely after reduced-motion changes. In reduced motion, show the completed writing immediately.

### 9. Accessibility, fallback, and interaction rules

1. Use meaningful headings, `article`s, links, and native `button`s inside each `<Html>` island. Add visible focus styles that contrast with cream/card and dark/monitor surfaces.
2. Give the canvas an accessible surrounding document structure; hide purely decorative Three meshes from the accessibility tree and never hide the actual content source.
3. Implement `prefers-reduced-motion` behavior before polish: skip scrubbed choreography, show a static DOM portfolio in the intended reading order, disable autoplaying media, and offer the same modal/details/contact paths.
4. Detect WebGL/context failure and render the same static fallback rather than a blank canvas. Keep it free of any dependency on the R3F scene completing.
5. Protect interaction layering: scene labels should not intercept clicks, monitor/envelope HTML must explicitly allow pointer events, and project modal overlay must appear over the canvas with correct focus/scroll locking.
6. Verify Escape closes the reused modal, focus is visibly restored to the launching monitor card, and outside click/links behave as currently intended.

### 10. Performance, assets, and polish

1. Convert/downsample the desk/card/stamp textures to realistic display resolution and modern compressed variants; the current source images alone total about 18 MB. Keep root-relative public paths compatible with GitHub Pages.
2. Keep geometry modest: one desk, one card, one monitor GLTF, one envelope, and DOM cards rather than duplicated high-poly assets. Dispose custom textures/materials on unmount where R3F/Drei does not own them.
3. Set a bounded DPR (for example 1–2), prefer antialiasing only after device testing, and pause/demand rendering where the final design permits. Avoid per-frame DOM writes, React re-renders, geometry mutation, or repeated `getTotalLength()` calls.
4. Lazy-load the monitor/scene when practical, preload it before the monitor chapter, and show a cohesive loading fallback so GLTF loading does not pop in during scrubbing.
5. Retain/confirm required CC-BY attribution for the monitor asset in the fallback/footer/credits route before deployment.

### 11. Verification and release gates

1. Run `npm run build` after each integration milestone and resolve any Vite chunk/asset warnings that materially affect first load.
2. Manually test the four chapters at all target viewport sizes. Capture side-by-side desktop/mobile screenshots for each end state plus mid-transition lift/flip frames.
3. Verify camera framing checks: card shows desk margin on mobile; timeline is readable without clipping; monitor screen is fully framed; envelope is readable but smaller than monitor.
4. Verify interaction checks: all five project cards render, opaque cards never show mirrored timeline content, every available link works, rich project cards open `ProjectModal`, and external-only projects do not incorrectly open it.
5. Verify scroll checks: no card/desk intersection during flip, forward/reverse scrolling is deterministic, resizing/orientation retains the same story phase, and trigger cleanup survives a Vite hot reload.
6. Verify keyboard, screen reader semantics, reduced-motion, WebGL-disabled fallback, and a slow-network GLTF load.
7. Build, preview with `npm run preview`, inspect static asset URLs under the configured GitHub Pages base, then deploy only after visual and interaction acceptance.

## Suggested milestone order

1. Root/data/modal plumbing and static fallback.
2. Responsive camera rig, scroll chapter contract, and a debug-anchor scene.
3. Desk/business-card/timeline sequence through the Phase 2 acceptance screenshots.
4. GLTF screen calibration and opaque project-screen UI with modal integration.
5. Envelope layout and handwriting stroke transition.
6. Asset optimization, accessibility/fallback hardening, responsive visual QA, build/preview verification.

## Definition of done

The public route is a stable four-phase scroll narrative whose data comes solely from `useContent()`. The business card lifts before it flips, the timeline can be read on its reverse, the calibrated monitor contains an opaque and clickable project page, and the final envelope has compact, animated, accessible contact information. It works responsively without clipping, preserves `/admin` and the existing project detail modal, provides reduced-motion/WebGL fallbacks, and passes the build plus the stated viewport/interaction checks.
