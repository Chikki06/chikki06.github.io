import { Mail, Linkedin, Github } from "lucide-react";
import research from "../../content/research.json";
import OutboundLink from "./OutboundLink.jsx";

const ACCENT = "#FF0000";
const BG = "#0a0a0a";
const FG = "#ffffff";
const MUTED = "#a3a3a3";

function SectionTitle({ children }) {
  return (
    <h2
      className="border-b pb-1 font-semibold tracking-tight"
      style={{ borderColor: ACCENT, color: FG }}
    >
      {children}
    </h2>
  );
}

function contactIcon(link) {
  const id = String(link.id || link.label || "").toLowerCase();
  if (id === "email" || String(link.url || "").startsWith("mailto:")) return Mail;
  if (id === "github") return Github;
  if (id === "linkedin") return Linkedin;
  return null;
}

function BulletList({ items }) {
  if (!Array.isArray(items) || !items.length) return null;
  return (
    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-200">
      {items.map((item) => {
        if (typeof item === "string") {
          return <li key={item}>{item}</li>;
        }
        const links = Array.isArray(item.links) ? item.links : [];
        return (
          <li key={item.label || item.text}>
            {item.label ? <strong className="text-white">{item.label}: </strong> : null}
            {item.text}
            {links.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {links.map((link) => (
                  <OutboundLink key={`${link.label}-${link.url}`} link={link} compact />
                ))}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Minimal academic / research CV page (`/r`), black + red to match the site.
 */
export default function ResearchPage() {
  const edu = research.education;
  const contactEmail = research.email || "Akshatshahi2006@gmail.com";
  const links = Array.isArray(research.links) ? research.links : [];

  return (
    <main
      className="research-page min-h-screen px-5 py-10 text-white md:px-8 md:py-14"
      style={{ backgroundColor: BG, color: FG, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-neutral-900 pb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
            Research
          </p>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            {research.headshot ? (
              <img
                src={research.headshot}
                alt={`${research.name} headshot`}
                width={128}
                height={128}
                decoding="async"
                className="h-28 w-28 shrink-0 object-cover object-top sm:h-32 sm:w-32"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <h1 className="pr-36 text-3xl font-semibold tracking-tight md:pr-44 md:text-4xl">
                {research.name}
              </h1>
              {research.tagline ? (
                <p className="mt-2 text-base text-neutral-300">{research.tagline}</p>
              ) : null}
              {research.about ? (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-400">
                  {research.about}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-base">
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-2 border-b border-transparent transition-colors hover:border-[#FF0000]"
                  style={{ color: ACCENT }}
                >
                  <Mail className="h-5 w-5" />
                  {contactEmail}
                </a>
                {links
                  .filter((link) => !String(link.url || "").startsWith("mailto:"))
                  .map((link) => {
                    const Icon = contactIcon(link);
                    return (
                      <a
                        key={link.id || link.label || link.url}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 border-b border-transparent transition-colors hover:border-[#FF0000]"
                        style={{ color: ACCENT }}
                      >
                        {Icon ? <Icon className="h-5 w-5" /> : null}
                        {link.label}
                      </a>
                    );
                  })}
              </div>
            </div>
          </div>
        </header>

        <section className="mt-10">
          <SectionTitle>Education</SectionTitle>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="text-base font-semibold">{edu.institution}</h3>
            <span className="font-mono text-xs text-neutral-400">{edu.date}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm text-neutral-300">
            <p className="italic">{edu.degree}</p>
            <p>{edu.gpa}</p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-neutral-300">
            <strong className="text-white">Coursework: </strong>
            {edu.coursework}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-neutral-300">
            <strong className="text-white">{edu.upcoming.split(":")[0]}: </strong>
            {edu.upcoming.includes(":") ? edu.upcoming.split(":").slice(1).join(":").trim() : edu.upcoming}
          </p>
        </section>

        <section className="mt-10">
          <SectionTitle>Research Experience</SectionTitle>
          {research.researchExperience.map((job) => (
            <article key={`${job.org}-${job.date}`} className="mt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-base font-semibold">{job.org}</h3>
                <span className="font-mono text-xs text-neutral-400">{job.date}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm text-neutral-300">
                <p className="italic">{job.role}</p>
                <p style={{ color: MUTED }}>{job.location}</p>
              </div>
              <BulletList items={job.bullets} />
            </article>
          ))}
        </section>

        <section className="mt-10">
          <SectionTitle>Selected Research Projects</SectionTitle>
          {research.projects.map((project) => (
            <article key={project.title} className="mt-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-base font-semibold">
                  {project.title}
                  {project.meta ? (
                    <span className="font-normal text-neutral-400"> | {project.meta}</span>
                  ) : null}
                </h3>
                <span className="font-mono text-xs text-neutral-400">{project.date}</span>
              </div>
              <BulletList items={project.bullets} />
              {project.url ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <OutboundLink link={{ label: "Repo", url: project.url }} compact />
                </div>
              ) : null}
            </article>
          ))}
        </section>

        <section className="mt-10 mb-6">
          <SectionTitle>Technical Skills</SectionTitle>
          <p className="mt-3 text-sm leading-relaxed text-neutral-300">
            <strong className="text-white">Languages: </strong>
            {research.skills.languages}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-neutral-300">
            <strong className="text-white">Technologies: </strong>
            {research.skills.technologies}
          </p>
        </section>
      </div>
    </main>
  );
}
