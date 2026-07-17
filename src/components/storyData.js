const fallback = (value, alternative) =>
  typeof value === "string" && value.trim() ? value : alternative;

/** A defensive, content-only view of the portfolio for the scroll story. */
export function createStoryData(timeline, site) {
  const nodes = Array.isArray(timeline) ? timeline.filter(Boolean) : [];
  const socials = Array.isArray(site?.socials) ? site.socials.filter(Boolean) : [];
  const findSocial = (id) => socials.find((social) => social.id?.toLowerCase() === id);

  return {
    hero: {
      name: fallback(site?.hero?.name, "Akshat Kumar Shahi"),
      tagline: fallback(
        site?.hero?.tagline || site?.hero?.subheader,
        "Software, research, and systems design.",
      ),
    },
    email: fallback(site?.contact?.email, "Akshatshahi2006@gmail.com"),
    socials,
    github: findSocial("github"),
    linkedin: findSocial("linkedin"),
    timeline: nodes,
    projects: nodes.filter((node) => node.type === "project" && node.project),
  };
}

export function projectTitle(node) {
  return fallback(node?.project?.title || node?.title, "Untitled project");
}

export function projectSummary(node) {
  return fallback(node?.project?.shortDescription || node?.summary, "Project details coming soon.");
}
