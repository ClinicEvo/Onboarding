/**
 * Dumps every question and its guidance to docs/questions.md and
 * docs/questions.html.
 *
 * Generated from lib/schema.ts rather than written by hand, so it cannot drift
 * from what the form actually asks. Regenerate with `npm run questions` after
 * changing the question set.
 */

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import {
  STEPS,
  ACCESS_ITEMS,
  BUSINESS_TYPES,
  ACCESS_STATUSES,
  type Field,
  type AccessItem,
} from "../lib/schema";

const ALL = STEPS;

const TYPE_LABEL: Record<string, string> = {
  text: "Short text",
  email: "Email",
  tel: "Phone",
  url: "Web address",
  textarea: "Long text",
  radio: "Pick one",
  checkbox: "Pick any",
  access: "Checklist",
};

/**
 * `showIf` is a function, so there is no clean way to describe a condition
 * generically. These read the source of each one and say it in English —
 * add a case here when a new conditional field is introduced.
 */
function accessCondition(item: AccessItem): string | null {
  if (!item.showIf) return null;
  const src = item.showIf.toString();
  if (src.includes("adAccounts")) return "Only if they run paid ads";
  if (src.includes("onlinePayments")) return "Only if the site takes payments";
  if (src.includes("newsletters")) return "Only if they send newsletters";
  return "Conditional";
}

function conditionText(field: Field): string | null {
  if (!field.showIf) return null;
  const src = field.showIf.toString();

  if (src.includes("CLINICAL")) return "Clinics and solo practitioners";
  if (src.includes("COACHING")) return "Trainers, gyms and studios";
  if (src.includes("Personal trainer or coach")) return "Personal trainers and coaches";
  if (src.includes("Gym, studio or class-based")) return "Gyms, studios and classes";
  if (src.includes("Something else")) return "If they picked “Something else”";
  if (src.includes("existingSite")) return "If they have a current website";
  if (src.includes("bookingSystem")) return "If they picked “Other”";
  if (src.includes("adAccounts")) return "If they already run ads";
  return "Conditional";
}

/* ---------------------------------------------------------------- Markdown */

const md: string[] = [];

md.push("# Every question we ask");
md.push("");
md.push(
  "Generated from `lib/schema.ts` — do not edit by hand. Run `npm run questions` to rebuild after changing the questions.",
);
md.push("");
md.push(
  `One form, ${STEPS.length} steps, about ten minutes. The rule for what earned a place: only what the client knows better than us — their business, their taste, their accounts. Pages, features, structure and competitor analysis are our recommendations to make, not their homework.\n\nBusiness types: ${BUSINESS_TYPES.map((t) => `*${t}*`).join(", ")}.`,
);
md.push("");

for (const [i, step] of ALL.entries()) {
  md.push(`## ${i + 1}. ${step.title}`);
  md.push("");
  md.push(`*${step.blurb}*`);
  md.push("");

  for (const field of step.fields) {
    if (field.type === "access") {
      md.push("### Access checklist");
      md.push("");
      md.push(
        `For each item the client picks one of: ${ACCESS_STATUSES.map((x) => `**${x}**`).join(", ")}.`,
      );
      md.push("");
      for (const item of ACCESS_ITEMS) {
        md.push(`**${item.label}**`);
        md.push("");
        if (item.grantTo) {
          md.push(`> Sent to **${item.grantTo}**, not the address given above.`);
          md.push("");
        }
        const ac = accessCondition(item);
        if (ac) {
          md.push(`> ${ac}.`);
          md.push("");
        }
        md.push(item.how);
        md.push("");
      }
      continue;
    }

    const flags: string[] = [TYPE_LABEL[field.type] ?? field.type];
    if (field.required) flags.push("**Required**");
    const cond = conditionText(field);
    if (cond) flags.push(`Only: ${cond}`);

    md.push(`### ${field.label}`);
    md.push("");
    md.push(flags.join(" · "));
    md.push("");
    if (field.options) {
      for (const o of field.options) md.push(`- ${o}`);
      md.push("");
    }
    if (field.help) {
      md.push(`> ${field.help}`);
      md.push("");
    }
  }
}

/* -------------------------------------------------------------------- HTML */

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const font = (file: string) =>
  readFileSync(`app/fonts/${file}`).toString("base64");

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const h: string[] = [];

h.push(`<style>
@font-face{font-family:"DM Sans CE";src:url(data:font/woff2;base64,${font("DMSans_24pt-Regular.woff2")}) format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:"DM Sans CE";src:url(data:font/woff2;base64,${font("DMSans_18pt-Medium.woff2")}) format("woff2");font-weight:500;font-display:swap}
@font-face{font-family:"Jakarta CE";src:url(data:font/woff2;base64,${font("PlusJakartaSans-SemiBold.woff2")}) format("woff2");font-weight:600;font-display:swap}

:root{
  --paper:#ffffff; --surface:#f5f7fa; --ink:#0d1b2a; --muted:#6b7280;
  --line:#e5e7eb; --accent:#ff5b4a; --accent-wash:#fff1ef;
  --sans:"DM Sans CE",ui-sans-serif,system-ui,sans-serif;
  --display:"Jakarta CE",ui-sans-serif,system-ui,sans-serif;
}
@media (prefers-color-scheme:dark){
  :root{
    --paper:#0b1420; --surface:#121d2b; --ink:#e8edf2; --muted:#8b97a6;
    --line:rgba(255,255,255,.10); --accent:#ff6e5e; --accent-wash:rgba(255,110,94,.11);
  }
}
:root[data-theme="dark"]{
  --paper:#0b1420; --surface:#121d2b; --ink:#e8edf2; --muted:#8b97a6;
  --line:rgba(255,255,255,.10); --accent:#ff6e5e; --accent-wash:rgba(255,110,94,.11);
}
:root[data-theme="light"]{
  --paper:#ffffff; --surface:#f5f7fa; --ink:#0d1b2a; --muted:#6b7280;
  --line:#e5e7eb; --accent:#ff5b4a; --accent-wash:#fff1ef;
}

*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);
  font-size:16px;line-height:1.7;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:var(--display);font-weight:600;text-wrap:balance;margin:0}
a{color:var(--accent)}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}

.wrap{max-width:78rem;margin:0 auto;padding:clamp(2.5rem,6vw,5rem) clamp(1.25rem,4vw,2.5rem) 6rem}

.eyebrow{display:flex;align-items:center;gap:.5rem;font-size:11px;font-weight:500;
  letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0 0 1rem}
.eyebrow::before{content:"";width:18px;height:1px;background:var(--accent);opacity:.55}

h1{font-size:clamp(2.25rem,5vw,3.5rem);line-height:1.06;letter-spacing:-.03em}
.lede{max-width:60ch;margin:1.25rem 0 0;font-size:1.0625rem;color:var(--muted)}

.stats{display:flex;flex-wrap:wrap;gap:2.5rem;margin:2.5rem 0 0;padding:1.5rem 0 0;
  border-top:1px solid var(--line)}
.stats div{display:flex;flex-direction:column;gap:.15rem}
.stats dt{order:2;font-size:.8125rem;color:var(--muted)}
.stats dd{order:1;margin:0;font-family:var(--display);font-size:1.75rem;
  line-height:1;font-variant-numeric:tabular-nums}

.layout{display:grid;grid-template-columns:1fr;gap:3rem;margin-top:4rem}
@media (min-width:64rem){.layout{grid-template-columns:15rem minmax(0,1fr);gap:4.5rem}}

.toc{display:none}
@media (min-width:64rem){
  .toc{display:block;position:sticky;top:2.5rem;align-self:start}
}
.toc p{margin:0 0 .85rem;font-size:11px;font-weight:500;letter-spacing:.14em;
  text-transform:uppercase;color:var(--muted)}
.toc ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.1rem;
  counter-reset:s}
.toc a{display:flex;gap:.7rem;padding:.35rem 0;font-size:.9375rem;color:var(--muted);
  text-decoration:none;transition:color .15s}
.toc a::before{counter-increment:s;content:counter(s);font-variant-numeric:tabular-nums;
  color:var(--line);font-size:.8125rem;padding-top:.12rem}
.toc a:hover{color:var(--accent)}

.step{padding-top:3.5rem;scroll-margin-top:2rem}
.step:first-child{padding-top:0}
.step-head{padding-bottom:1.75rem;border-bottom:2px solid var(--ink)}
.step-head h2{font-size:clamp(1.5rem,3vw,2rem);letter-spacing:-.02em}
.step-head .blurb{max-width:62ch;margin:.6rem 0 0;color:var(--muted)}

.q{padding:1.75rem 0;border-bottom:1px solid var(--line)}
.q h3{font-size:1.0625rem;letter-spacing:-.01em}

.tags{display:flex;flex-wrap:wrap;gap:.4rem;margin:.6rem 0 0}
.tag{font-size:.75rem;line-height:1.5;padding:.1rem .5rem;border-radius:3px;
  border:1px solid var(--line);color:var(--muted);white-space:nowrap}
.tag.req{border-color:var(--accent);color:var(--accent)}
.tag.cond{border-color:transparent;background:var(--accent-wash);color:var(--accent)}

.guide{max-width:64ch;margin:.85rem 0 0;padding-left:.9rem;
  border-left:2px solid var(--line);color:var(--muted);font-size:.9375rem}

.options{margin:.85rem 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:.35rem}
.options li{font-size:.875rem;padding:.15rem .6rem;border-radius:3px;
  background:var(--surface);color:var(--ink)}

.access-intro{margin:1.5rem 0 0;max-width:64ch;color:var(--muted)}
.statuses{display:flex;flex-wrap:wrap;gap:.4rem;margin:.85rem 0 0;padding:0;list-style:none}
.statuses li{font-size:.8125rem;padding:.15rem .6rem;border:1px solid var(--line);
  border-radius:3px}

.item{padding:1.5rem 0;border-bottom:1px solid var(--line)}
.item h4{margin:0;font-family:var(--display);font-weight:600;font-size:1rem}
.item .how{max-width:64ch;margin:.5rem 0 0;color:var(--muted);font-size:.9375rem}
.grant{margin:.6rem 0 0;font-size:.875rem}
.grant strong{color:var(--accent)}

footer{margin-top:4rem;padding-top:1.5rem;border-top:1px solid var(--line);
  font-size:.875rem;color:var(--muted)}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.875em;
  background:var(--surface);padding:.1rem .35rem;border-radius:3px}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>`);

h.push(`<div class="wrap">
<p class="eyebrow">Clinic Evo onboarding</p>
<h1>Every question we ask</h1>
<p class="lede">One form, about ten minutes. Only what the client knows better than us — their business, their taste, their accounts. Everything else is either researched by us or discussed in the kickoff.</p>
<dl class="stats">
  <div><dt>Steps</dt><dd>${STEPS.length}</dd></div>
  <div><dt>Questions</dt><dd>${ALL.reduce((n, s) => n + s.fields.filter((f) => f.type !== "access").length, 0)}</dd></div>
  <div><dt>Accounts, at most</dt><dd>${ACCESS_ITEMS.length}</dd></div>
  <div><dt>Typical clinic sees</dt><dd>${ACCESS_ITEMS.filter((i) => !i.showIf).length}</dd></div>
</dl>
<div class="layout">
<nav class="toc"><p>Steps</p><ol>`);

for (const step of ALL) {
  h.push(`<li><a href="#${slug(step.title)}">${esc(step.title)}</a></li>`);
}

h.push(`</ol></nav><main>`);

for (const step of ALL) {
  h.push(`<section class="step" id="${slug(step.title)}">
    <div class="step-head">
      <h2>${esc(step.title)}</h2>
      <p class="blurb">${esc(step.blurb)}</p>
    </div>`);

  for (const field of step.fields) {
    if (field.type === "access") {
      h.push(`<p class="access-intro">The client works down this list and marks each one:</p>
        <ul class="statuses"><li>Granted</li><li>Will do</li><li>Do not have</li><li>Need help</li></ul>`);
      for (const item of ACCESS_ITEMS) {
        h.push(`<div class="item"><h4>${esc(item.label)}</h4>`);
        const ac = accessCondition(item);
        if (ac) {
          h.push(`<div class="tags"><span class="tag cond">${esc(ac)}</span></div>`);
        }
        h.push(`<p class="how">${esc(item.how)}</p>`);
        if (item.grantTo) {
          h.push(
            `<p class="grant">Goes to <strong>${esc(item.grantTo)}</strong>, not the address given at the top of the step.</p>`,
          );
        }
        h.push(`</div>`);
      }
      continue;
    }

    const cond = conditionText(field);
    h.push(`<div class="q"><h3>${esc(field.label)}</h3><div class="tags">`);
    if (field.required) h.push(`<span class="tag req">Required</span>`);
    h.push(`<span class="tag">${esc(TYPE_LABEL[field.type] ?? field.type)}</span>`);
    if (cond) h.push(`<span class="tag cond">${esc(cond)}</span>`);
    h.push(`</div>`);

    if (field.options) {
      h.push(`<ul class="options">`);
      for (const o of field.options) h.push(`<li>${esc(o)}</li>`);
      h.push(`</ul>`);
    }
    if (field.help) h.push(`<p class="guide">${esc(field.help)}</p>`);
    h.push(`</div>`);
  }

  h.push(`</section>`);
}

h.push(`</main></div>
<footer>Generated from <code>lib/schema.ts</code>. Rebuild with <code>npm run questions</code> after changing the questions — editing this page by hand will be overwritten.</footer>
</div>`);

mkdirSync("docs", { recursive: true });
writeFileSync("docs/questions.md", md.join("\n"));
writeFileSync("docs/questions.html", h.join("\n"));

console.log(
  `docs/questions.md + docs/questions.html — ${STEPS.length} steps, ${ALL.reduce((n, s) => n + s.fields.filter((f) => f.type !== "access").length, 0)} questions, up to ${ACCESS_ITEMS.length} accounts.`,
);
