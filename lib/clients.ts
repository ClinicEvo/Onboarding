/**
 * Per-client access codes.
 *
 * Each client gets their own link — `/?c=bodyfunction` — which does two jobs:
 * it stops strangers submitting into the Drive, and it means the destination
 * folder is named from this list rather than from whatever the client types.
 * That second part is what keeps `1% Club` from becoming `The 1 Percent Club`.
 *
 * Configured via the CLIENT_CODES env var, one client per line or
 * comma-separated:
 *
 *   CLIENT_CODES="bodyfunction=Bodyfunction Clinic,onepercent=1% Club"
 *
 * The value on the right must match the OneDrive folder name exactly.
 *
 * If CLIENT_CODES is unset the form stays open to anyone, which is the
 * behaviour before this existed. Set it to turn gating on.
 */

export function getClients(): Map<string, string> {
  const raw = process.env.CLIENT_CODES?.trim();
  const clients = new Map<string, string>();
  if (!raw) return clients;

  for (const entry of raw.split(/[\n,]/)) {
    const [code, ...rest] = entry.split("=");
    const name = rest.join("=").trim();
    const key = code?.trim().toLowerCase();
    if (key && name) clients.set(key, name);
  }

  return clients;
}

/** Whether gating is switched on at all. */
export function gatingEnabled(): boolean {
  return getClients().size > 0;
}

/**
 * Resolves a code to a client name.
 *
 * Returns the name when the code is valid, `null` when it is not, and
 * `undefined` when gating is off entirely — three distinct cases the callers
 * need to tell apart.
 */
export function lookupClient(code: string | undefined): string | null | undefined {
  const clients = getClients();
  if (clients.size === 0) return undefined;
  if (!code) return null;
  return clients.get(code.trim().toLowerCase()) ?? null;
}
