import { Github, Linkedin } from "lucide-react";

/** Editable HTML source for the contact letter. Baked to a mesh at runtime. */
export default function LetterFace({ data }) {
  return (
    <section
      className="relative box-border grid h-full w-full grid-rows-[auto_1fr] overflow-hidden bg-transparent p-8 text-[#6b3827] antialiased"
      aria-label="Contact envelope"
    >
      <p className="row-start-1 mt-3 self-start font-[Indie_Flower,cursive] text-[21px] tracking-[.03em]">Address:</p>
      <div className="absolute right-7 top-6 flex gap-2">
        <a
          data-bake-hitbox=""
          href={data.linkedin?.url || "#"}
          target="_blank"
          rel="noreferrer"
          className="relative flex h-[78px] w-[78px] -rotate-6 items-center justify-center"
          aria-label="Akshat on LinkedIn"
        >
          <img src="/assets/stamp.webp" alt="" className="absolute inset-0 h-full w-full object-contain" />
          <Linkedin className="relative h-5 w-5 text-[#7d4430]" />
        </a>
        <a
          data-bake-hitbox=""
          href={data.github?.url || "#"}
          target="_blank"
          rel="noreferrer"
          className="relative flex h-[78px] w-[78px] rotate-3 items-center justify-center"
          aria-label="Akshat on GitHub"
        >
          <img src="/assets/stamp.webp" alt="" className="absolute inset-0 h-full w-full object-contain" />
          <Github className="relative h-5 w-5 text-[#7d4430]" />
        </a>
      </div>
      <a
        data-bake-hitbox=""
        href={`mailto:${data.email}`}
        className="row-start-2 mt-3 flex w-max max-w-none items-start self-center whitespace-nowrap font-[Indie_Flower,cursive] text-[32px] leading-none text-[#6b3827]"
        aria-label={`Email ${data.email}`}
      >
        {data.email}
      </a>
    </section>
  );
}
