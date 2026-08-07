import {
  STEPS,
  ACCESS_STEP,
  visibleFields,
  visibleAccessItems,
  type Values,
} from "./schema";

export type FormKind = "onboarding" | "access";

/** The two forms render from different step sets. */
export const stepsFor = (kind: FormKind) =>
  kind === "access" ? [ACCESS_STEP] : STEPS;

/**
 * Renders a submission into a Markdown brief.
 *
 * This lives here rather than in the Make scenario so the formatting is
 * version-controlled and testable. Make just writes the string to a file.
 */

function renderAnswer(value: string | string[]): string {
  if (Array.isArray(value)) return value.join(", ");
  const text = value.trim();
  // Multi-line answers read better as a quoted block than an inline run-on.
  return text.includes("\n")
    ? "\n" + text.split("\n").map((l) => `  ${l}`).join("\n")
    : text;
}

export function renderBrief(
  values: Values,
  accessGrants: Record<string, string>,
  submittedAt: string,
  kind: FormKind = "onboarding",
): string {
  const lines: string[] = [];
  const name = String(values.businessName ?? "Unnamed").trim();

  lines.push(`# ${name} — ${kind === "access" ? "account access" : "onboarding brief"}`);
  lines.push("");
  lines.push(
    `Submitted ${new Date(submittedAt).toLocaleString("en-GB", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Europe/London",
    })}`,
  );
  lines.push("");

  for (const step of stepsFor(kind)) {
    const fields = visibleFields(step, values).filter(
      (f) => f.type !== "access",
    );

    const answered = fields.filter((f) => {
      const v = values[f.id];
      return Array.isArray(v) ? v.length > 0 : Boolean(v?.trim());
    });

    if (answered.length === 0 && step.id !== "access") continue;

    lines.push(`## ${step.title}`);
    lines.push("");

    for (const field of answered) {
      lines.push(`**${field.label}**`);
      lines.push(renderAnswer(values[field.id]));
      lines.push("");
    }

    // Unanswered optional questions are worth seeing — they are the follow-ups.
    const skipped = fields.filter((f) => !answered.includes(f));
    if (skipped.length > 0) {
      lines.push(`_Not answered: ${skipped.map((f) => f.label).join("; ")}_`);
      lines.push("");
    }
  }

  if (kind !== "access") return lines.join("\n");

  /* Access gets its own treatment — it is the section that blocks the build. */
  lines.push("## Access status");
  lines.push("");

  // Only the rows this client was actually shown — listing ad platforms as
  // "Not answered" for someone who does not run ads is just noise.
  const grantEntries = visibleAccessItems(values).map((item) => ({
    label: item.grantTo ? `${item.label} (to ${item.grantTo})` : item.label,
    status: accessGrants[item.id] || "Not answered",
  }));

  lines.push("| Item | Status |");
  lines.push("| --- | --- |");
  for (const { label, status } of grantEntries) {
    lines.push(`| ${label} | ${status} |`);
  }
  lines.push("");

  const blocking = grantEntries.filter(
    (g) => g.status === "Will do" || g.status === "Not sure — help me",
  );
  if (blocking.length > 0) {
    lines.push(
      `**Chase these:** ${blocking
        .map((g) => `${g.label} (${g.status})`)
        .join("; ")}`,
    );
    lines.push("");
  }

  if (values.secretLink) {
    lines.push(
      `**One-time credential link supplied.** Open it promptly — these expire, and it can only be viewed once.`,
    );
    lines.push("");
  }

  return lines.join("\n");
}
