import timeline from "../../content/timeline.json";

// Single source of truth for the timeline: we import the JSON file that the
// /admin editor updates in development. In production (GitHub Pages), this is
// bundled statically.
export const timelineData = timeline;

