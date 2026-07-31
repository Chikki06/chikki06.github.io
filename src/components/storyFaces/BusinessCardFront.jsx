/** Am Psycho–style name: large initial + small-caps rest of first name; middle/last full height. */
function CardName({ name }) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return null;

  const [first, ...rest] = parts;
  const initial = first.charAt(0).toUpperCase();
  const restOfFirst = first.slice(1).toUpperCase();
  const trailing = rest.map((part) => part.toUpperCase()).join(" ");

  return (
    <h1
      className="font-['EB_Garamond',ui-serif,Georgia,serif] font-medium leading-none tracking-[0.08em] text-[#1a1814]"
      aria-label={name}
    >
      <span className="text-[22px]">{initial}</span>
      {restOfFirst ? <span className="text-[16.5px]">{restOfFirst}</span> : null}
      {trailing ? <span className="text-[22px]"> {trailing}</span> : null}
    </h1>
  );
}

/** Editable HTML source for the business-card front. Baked to a mesh at runtime. */
export default function BusinessCardFront({ data }) {
  return (
    <div className="relative box-border flex h-full w-full flex-col overflow-hidden bg-transparent px-6 pb-3 pt-5 font-['EB_Garamond',ui-serif,Georgia,serif] text-[#1c1914] antialiased">
      <div className="flex shrink-0 items-start justify-between text-[12px] tracking-[0.04em] text-[#3f3b34]">
        {data.github?.url ? (
          <a
            data-bake-hitbox=""
            className="underline decoration-[#a77d46]/50 underline-offset-4"
            href={data.github.url}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        ) : (
          <span />
        )}
        {data.linkedin?.url ? (
          <a
            data-bake-hitbox=""
            className="underline decoration-[#a77d46]/50 underline-offset-4"
            href={data.linkedin.url}
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
        ) : (
          <span />
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <CardName name={data.hero.name} />
        <p className="mt-2.5 text-[14px] font-normal tracking-[0.02em] text-[#4a453c]">CS@UIUC</p>
      </div>

      <p className="shrink-0 text-center text-[8px] uppercase tracking-[0.14em] text-[#5c564c]">
        Software Systems · Data Engineering · Deep Learning
      </p>
    </div>
  );
}
