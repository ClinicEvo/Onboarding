import {
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import { STEPS, visibleFields, visibleAccessItems, type Values } from "./schema";

/**
 * Builds the onboarding brief as a real Word document.
 *
 * Same content as `renderBrief`, which is kept for the local dev log and for
 * anywhere a plain-text version is easier to read. This is what actually gets
 * filed, so the brief opens and edits in Word rather than looking like source.
 */

/* Clinic Evo brand colours, hex without the leading #, as docx expects. */
const INK = "0D1B2A";
const ACCENT = "FF5B4A";
const MUTED = "6B7280";
const LINE = "E5E7EB";

const hairline = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: LINE,
};

function answerParagraphs(value: string | string[]): Paragraph[] {
  const text = Array.isArray(value) ? value.join(", ") : value.trim();

  // Multi-line answers become separate paragraphs so lists of services or
  // practitioners do not collapse into one run-on block.
  return text.split("\n").map(
    (line) =>
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: line.trim(), size: 21, color: INK })],
      }),
  );
}

export function buildBriefDocx(
  values: Values,
  accessGrants: Record<string, string>,
  submittedAt: string,
): Promise<Buffer> {
  const name = String(values.businessName ?? "Unnamed").trim();
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 100 },
      children: [new TextRun({ text: name, bold: true, size: 48, color: INK })],
    }),
    new Paragraph({
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Onboarding brief · submitted ${new Date(submittedAt).toLocaleString(
            "en-GB",
            { dateStyle: "long", timeStyle: "short", timeZone: "Europe/London" },
          )}`,
          size: 19,
          color: MUTED,
        }),
      ],
    }),
  );

  for (const step of STEPS) {
    const fields = visibleFields(step, values).filter((f) => f.type !== "access");

    const answered = fields.filter((f) => {
      const v = values[f.id];
      return Array.isArray(v) ? v.length > 0 : Boolean(v?.trim());
    });

    if (answered.length === 0) continue;

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 160 },
        children: [
          new TextRun({ text: step.title, bold: true, size: 30, color: INK }),
        ],
      }),
    );

    for (const field of answered) {
      children.push(
        new Paragraph({
          spacing: { before: 160, after: 40 },
          children: [
            new TextRun({ text: field.label, bold: true, size: 21, color: INK }),
          ],
        }),
        ...answerParagraphs(values[field.id]),
      );
    }

    const skipped = fields.filter((f) => !answered.includes(f));
    if (skipped.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({
              text: `Not answered: ${skipped.map((f) => f.label).join("; ")}`,
              italics: true,
              size: 19,
              color: MUTED,
            }),
          ],
        }),
      );
    }
  }

  /* Access gets a real table — it is the section that blocks the build. */
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 160 },
      children: [
        new TextRun({ text: "Access status", bold: true, size: 30, color: INK }),
      ],
    }),
  );

  const rows = visibleAccessItems(values).map((item) => ({
    label: item.grantTo ? `${item.label} (to ${item.grantTo})` : item.label,
    status: accessGrants[item.id] || "Not answered",
  }));

  const cell = (text: string, opts: { bold?: boolean; color?: string } = {}) =>
    new TableCell({
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      borders: { top: hairline, bottom: hairline, left: hairline, right: hairline },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text,
              size: 20,
              bold: opts.bold,
              color: opts.color ?? INK,
            }),
          ],
        }),
      ],
    });

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [cell("Item", { bold: true }), cell("Status", { bold: true })],
        }),
        ...rows.map(
          (r) =>
            new TableRow({
              children: [
                cell(r.label),
                cell(
                  r.status,
                  r.status === "Will do" || r.status === "Need help"
                    ? { color: ACCENT, bold: true }
                    : {},
                ),
              ],
            }),
        ),
      ],
    }),
  );

  const blocking = rows.filter(
    (r) => r.status === "Will do" || r.status === "Need help",
  );

  if (blocking.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 240 },
        children: [
          new TextRun({ text: "Chase these: ", bold: true, size: 21, color: ACCENT }),
          new TextRun({
            text: blocking.map((g) => `${g.label} (${g.status})`).join("; "),
            size: 21,
            color: INK,
          }),
        ],
      }),
    );
  }

  if (values.adAccounts === "No, and we would like help setting them up") {
    children.push(
      new Paragraph({
        spacing: { before: 160 },
        children: [
          new TextRun({
            text: "They want help setting up ad accounts. No ad platform access was requested for that reason.",
            bold: true,
            size: 21,
            color: INK,
          }),
        ],
      }),
    );
  }

  if (values.secretLink) {
    children.push(
      new Paragraph({
        spacing: { before: 160 },
        children: [
          new TextRun({
            text: "A one-time credential link was supplied. Open it promptly — these expire and can only be viewed once.",
            bold: true,
            size: 21,
            color: ACCENT,
          }),
        ],
      }),
    );
  }

  const doc = new Document({
    creator: "Clinic Evo onboarding",
    title: `${name} — onboarding brief`,
    styles: {
      default: {
        document: { run: { font: "Aptos", size: 21, color: INK } },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc) as unknown as Promise<Buffer>;
}

/** Base64 for handing to Make, which decodes it back to bytes before upload. */
export async function buildBriefDocxBase64(
  values: Values,
  accessGrants: Record<string, string>,
  submittedAt: string,
): Promise<string> {
  const buffer = await buildBriefDocx(values, accessGrants, submittedAt);
  return Buffer.from(buffer).toString("base64");
}

/** Word-safe filename — same forbidden characters as the folder name. */
export function briefFilename(businessName: string): string {
  const safe = businessName
    .replace(/["*:<>?/\\|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${safe} — onboarding brief.docx`;
}
