import { z } from "zod";
import { renderBrief } from "@/lib/brief";

/**
 * Receives the completed form and forwards it to Make.
 *
 * The Make webhook URL stays server-side. If it were in the client bundle,
 * anyone could read it out of the page source and post junk straight into
 * the Drive folder.
 */

const payloadSchema = z.object({
  values: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  accessGrants: z.record(z.string(), z.string()),
  submittedAt: z.string(),
});

/** Roughly 200KB — comfortably above a full form, well below anything abusive. */
const MAX_BODY_BYTES = 200_000;

export async function POST(request: Request) {
  const raw = await request.text();

  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: "That submission is too large." }, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const result = payloadSchema.safeParse(parsed);
  if (!result.success) {
    return Response.json({ error: "Unexpected form data." }, { status: 400 });
  }

  const { values, accessGrants, submittedAt } = result.data;

  const businessName = String(values.businessName ?? "").trim();
  const contactEmail = String(values.contactEmail ?? "").trim();

  if (!businessName || !contactEmail) {
    return Response.json(
      { error: "Business name and email are both needed." },
      { status: 400 },
    );
  }

  const webhookUrl = process.env.MAKE_WEBHOOK_URL;

  if (!webhookUrl) {
    // Local development without Make wired up: log and accept, so the form
    // can be exercised end to end. Production is never allowed to no-op.
    if (process.env.NODE_ENV === "production") {
      return Response.json(
        { error: "Submissions are not configured yet." },
        { status: 500 },
      );
    }
    console.log("[submit] MAKE_WEBHOOK_URL unset — brief follows:\n");
    console.log(renderBrief(values, accessGrants, submittedAt));
    return Response.json({ ok: true, delivered: false });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const forwarded = await fetch(webhookUrl, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Shared secret so the scenario can reject anything that did not come
        // through this route. Sent in the body rather than a header purely
        // because Make filters on body fields far more reliably than on
        // hyphenated header names. Equally private either way over HTTPS.
        secret: process.env.MAKE_WEBHOOK_SECRET ?? "",
        businessName,
        contactEmail,
        businessType: values.businessType ?? "",
        submittedAt,
        // Folder-safe name for Drive.
        folderName: businessName.replace(/[^\w\s-]/g, "").trim().slice(0, 80),
        // Pre-formatted Markdown so the Make scenario only has to write a file.
        brief: renderBrief(values, accessGrants, submittedAt),
        values,
        accessGrants,
      }),
    });

    if (!forwarded.ok) {
      console.error("[submit] Make returned", forwarded.status);
      return Response.json(
        { error: "Our system did not accept it." },
        { status: 502 },
      );
    }

    return Response.json({ ok: true, delivered: true });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    console.error("[submit] forwarding failed:", err);
    return Response.json(
      { error: aborted ? "The request timed out." : "We could not reach our system." },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
