/**
 * Dumps every question and its guidance to docs/questions.md.
 *
 * Generated from lib/schema.ts rather than written by hand, so it cannot drift
 * from what the form actually asks. Regenerate with `npm run questions` after
 * changing the question set.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { STEPS, ACCESS_ITEMS, BUSINESS_TYPES, type Field } from "../lib/schema";

const out: string[] = [];

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
function conditionText(field: Field): string | null {
  if (!field.showIf) return null;
  const src = field.showIf.toString();

  if (src.includes("CLINICAL")) return "Clinics and solo practitioners only";
  if (src.includes("COACHING")) return "Personal trainers, gyms and studios only";
  if (src.includes("Personal trainer or coach")) return "Personal trainers and coaches only";
  if (src.includes("Gym, studio or class-based")) return "Gyms, studios and class-based only";
  if (src.includes("Something else")) return "Only if they picked “Something else”";
  if (src.includes("existingSite")) return "Only if they have a current website";
  if (src.includes("bookingSystem")) return "Only if they picked “Other”";
  if (src.includes("adAccounts")) return "Only if they already have ad accounts";
  return "Conditional";
}

out.push("# Every question we ask");
out.push("");
out.push(
  "Generated from `lib/schema.ts` — do not edit by hand. Run `npm run questions` to rebuild after changing the questions.",
);
out.push("");
out.push(
  `The form has ${STEPS.length} steps. Question two, **What kind of business is this?**, decides which of the later questions appear. The options are: ${BUSINESS_TYPES.map((t) => `*${t}*`).join(", ")}.`,
);
out.push("");
out.push("Fields marked **Required** must be filled in before the client can continue.");
out.push("");

for (const [i, step] of STEPS.entries()) {
  out.push(`## ${i + 1}. ${step.title}`);
  out.push("");
  out.push(`*${step.blurb}*`);
  out.push("");

  for (const field of step.fields) {
    if (field.type === "access") {
      out.push("### Access checklist");
      out.push("");
      out.push(
        "For each item below the client picks one of: **Granted**, **Will do**, **Do not have**, **Need help**.",
      );
      out.push("");
      for (const item of ACCESS_ITEMS) {
        out.push(`**${item.label}**`);
        if (item.grantTo) {
          out.push("");
          out.push(`> Sent to **${item.grantTo}**, not the address given above.`);
        }
        if (item.showIf) {
          out.push("");
          out.push("> Only shown if they already have ad accounts.");
        }
        out.push("");
        out.push(item.how);
        out.push("");
      }
      continue;
    }

    const flags: string[] = [TYPE_LABEL[field.type] ?? field.type];
    if (field.required) flags.push("**Required**");
    const cond = conditionText(field);
    if (cond) flags.push(cond);

    out.push(`### ${field.label}`);
    out.push("");
    out.push(flags.join(" · "));
    out.push("");
    if (field.options) {
      for (const o of field.options) out.push(`- ${o}`);
      out.push("");
    }
    if (field.help) {
      out.push(`> ${field.help}`);
      out.push("");
    }
  }
}

mkdirSync("docs", { recursive: true });
writeFileSync("docs/questions.md", out.join("\n"));

const fieldCount = STEPS.reduce(
  (n, s) => n + s.fields.filter((f) => f.type !== "access").length,
  0,
);
console.log(
  `docs/questions.md written — ${STEPS.length} steps, ${fieldCount} questions, ${ACCESS_ITEMS.length} access items.`,
);
