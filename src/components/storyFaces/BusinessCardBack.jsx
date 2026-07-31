const CARD_EXCLUDED_IDS = new Set(["2023-machani-robotics"]);

/** Editable HTML source for the business-card back. Baked to a mesh at runtime. */
export default function BusinessCardBack({ nodes }) {
  const experienceNodes = (Array.isArray(nodes) ? nodes : [])
    .filter((node) => node.type !== "project" && !CARD_EXCLUDED_IDS.has(node.id))
    .slice(0, 4);

  return (
    <section
      className="box-border flex h-full w-full flex-col justify-center overflow-hidden bg-transparent px-9 py-8 font-['EB_Garamond',ui-serif,Georgia,serif] text-[#1c1914] antialiased"
      aria-label="Experience"
    >
      <div className="flex flex-col gap-7">
        {experienceNodes.map((node) => {
          const org = node.organization || node.institution;
          const when = node.dateLabel || node.year;
          const detail = [org, when].filter(Boolean).join(" · ");
          return (
            <article key={node.id || `${node.year}-${node.title}`} className="text-center">
              <h3 className="text-[14px] font-medium leading-snug tracking-[0.03em]">
                {node.title || "Untitled entry"}
              </h3>
              {detail ? (
                <p className="mt-1.5 text-[11px] font-normal leading-snug tracking-[0.02em] text-[#5a554c]">
                  {detail}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
