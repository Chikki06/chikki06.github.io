import { useState } from "react";

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <label className="mb-3 block text-xs">
      <div className="mb-1 font-mono uppercase tracking-[0.16em] text-neutral-400">
        {label}
      </div>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-50 focus:outline-none focus:border-[#c41a1a]"
      />
    </label>
  );
}

function SocialList({ socials, onChange }) {
  const handleFieldChange = (index, field, value) => {
    const next = [...(socials || [])];
    next[index] = { ...(next[index] || {}), [field]: value };
    onChange(next);
  };

  const handleAdd = () => {
    const next = [
      ...(socials || []),
      { id: "new", label: "New Link", url: "https://", icon: "" },
    ];
    onChange(next);
  };

  const handleRemove = (index) => {
    const next = (socials || []).filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-mono uppercase tracking-[0.16em] text-neutral-400">
          Social links
        </h3>
        <button
          type="button"
          onClick={handleAdd}
          className="px-2 py-1 text-[11px] font-mono uppercase tracking-[0.16em] border border-neutral-700 text-neutral-300 hover:border-[#c41a1a] hover:text-[#c41a1a]"
        >
          Add
        </button>
      </div>
      {(socials || []).length === 0 ? (
        <p className="text-[11px] text-neutral-500">
          No social links yet. Add one to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {(socials || []).map((social, idx) => (
            <div
              key={`${social.id || social.label || idx}-${idx}`}
              className="border border-neutral-800 bg-neutral-950/80 px-3 py-2"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-500">
                  {social.id || "link"}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#fecaca] hover:text-white"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <input
                  type="text"
                  value={social.id || ""}
                  onChange={(e) => handleFieldChange(idx, "id", e.target.value)}
                  placeholder="id (e.g. github, linkedin)"
                  className="border border-neutral-700 bg-black px-2 py-1.5 text-[11px] text-neutral-50 focus:outline-none focus:border-[#c41a1a]"
                />
                <input
                  type="text"
                  value={social.label || ""}
                  onChange={(e) =>
                    handleFieldChange(idx, "label", e.target.value)
                  }
                  placeholder="label (e.g. GitHub)"
                  className="border border-neutral-700 bg-black px-2 py-1.5 text-[11px] text-neutral-50 focus:outline-none focus:border-[#c41a1a]"
                />
                <input
                  type="text"
                  value={social.url || ""}
                  onChange={(e) =>
                    handleFieldChange(idx, "url", e.target.value)
                  }
                  placeholder="https://…"
                  className="border border-neutral-700 bg-black px-2 py-1.5 text-[11px] text-neutral-50 focus:outline-none focus:border-[#c41a1a]"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminSiteEditor({ site, onChange }) {
  const hero = site?.hero || {};
  const contact = site?.contact || {};

  const updateHeroField = (field, value) => {
    onChange({
      ...site,
      hero: {
        ...hero,
        [field]: value,
      },
    });
  };

  const updateContactField = (field, value) => {
    onChange({
      ...site,
      contact: {
        ...contact,
        [field]: value,
      },
    });
  };

  const updateSocials = (next) => {
    onChange({
      ...site,
      socials: next,
    });
  };

  return (
    <div className="text-sm text-neutral-200">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-neutral-50">
            Hero & contact
          </h2>
          <p className="text-xs text-neutral-500">
            Control the top-of-page hero block, primary contact, and socials.
          </p>
        </div>
      </div>

      <section className="max-w-xl space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-[0.16em] text-neutral-400">
          Hero
        </h3>
        <TextInput
          label="Name"
          value={hero.name}
          onChange={(v) => updateHeroField("name", v)}
        />
        <TextInput
          label="Tagline"
          value={hero.tagline}
          onChange={(v) => updateHeroField("tagline", v)}
          placeholder="Short line under your name"
        />
        <TextInput
          label="Subheader"
          value={hero.subheader}
          onChange={(v) => updateHeroField("subheader", v)}
          placeholder="Optional extra line"
        />

        <h3 className="mt-4 text-xs font-mono uppercase tracking-[0.16em] text-neutral-400">
          Contact
        </h3>
        <TextInput
          label="Email"
          value={contact.email}
          onChange={(v) => updateContactField("email", v)}
        />

        <SocialList socials={site?.socials || []} onChange={updateSocials} />
      </section>

      <section className="mt-6 border-t border-neutral-900 pt-4">
        <h3 className="mb-2 text-xs font-mono uppercase tracking-[0.16em] text-neutral-400">
          Advanced JSON (site)
        </h3>
        <p className="mb-2 text-[11px] text-neutral-500">
          For power edits, you can copy this JSON into your editor, modify it, and
          paste it back via the API. The admin UI currently exposes the most
          important fields directly.
        </p>
        <pre className="max-h-40 overflow-auto border border-neutral-900 bg-black/80 p-3 text-[11px] text-neutral-300">
          {JSON.stringify(site ?? {}, null, 2)}
        </pre>
      </section>
    </div>
  );
}
