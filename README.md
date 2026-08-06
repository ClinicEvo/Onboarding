# Client onboarding form

A branching onboarding questionnaire for new website clients — clinics, solo
practitioners, personal trainers, gyms and studios. Answers land in Drive as a
formatted brief.

It collects **access grants, not passwords**. See [Why no password fields](#why-no-password-fields).

---

## Running it

```bash
npm run dev
```

Without `MAKE_WEBHOOK_URL` set, submissions are accepted and the rendered brief
is printed to the terminal, so you can exercise the whole form locally before
wiring up Make. In production a missing webhook URL is a hard error rather than
a silent no-op.

---

## How it fits together

```
Client fills form
      │
      ▼
POST /api/submit          validates, renders the brief, adds the shared secret
      │
      ▼
Make webhook              rejects anything without the secret
      │
      ├─►  Drive: create /Clients/[Business Name]/
      ├─►  Drive: create /Assets/ inside it
      ├─►  Drive: write "Onboarding brief" from the rendered Markdown
      └─►  Notify you
```

The Make webhook URL never reaches the browser. If it did, anyone could read it
out of the page source and post junk straight into your Drive.

---

## Setting up the Make scenario

**1. Webhooks → Custom webhook**

Add the module, click *Add*, name it `onboarding`, and copy the URL it gives you.

**2. Add a filter immediately after the webhook**

Right-click the connector after the webhook and add a filter:

| Setting | Value |
| --- | --- |
| Condition | `{{1.headers.x-onboarding-secret}}` |
| Operator | Text: Equal to |
| Value | your `MAKE_WEBHOOK_SECRET` |

Without this filter, anyone who discovers the webhook URL can write into your
Drive. It is the only thing protecting it.

**3. Google Drive → Create a Folder**

| Setting | Value |
| --- | --- |
| Folder name | `{{1.folderName}}` |
| Parent folder | your `Clients` folder |

**4. Google Drive → Create a Folder** (second one)

| Setting | Value |
| --- | --- |
| Folder name | `Assets` |
| Parent folder | the folder ID from step 3 |

**5. Google Docs → Create a Document**

| Setting | Value |
| --- | --- |
| Name | `{{1.businessName}} — onboarding brief` |
| Content | `{{1.brief}}` |
| Destination folder | the folder ID from step 3 |

The `brief` field arrives as formatted Markdown, already assembled. There is no
template document to maintain and no placeholder mapping to keep in sync with
the questions — that logic lives in `lib/brief.ts`.

**6. Notify yourself**

Email, Slack or Teams — whichever you actually read. Useful fields:

- `{{1.businessName}}`
- `{{1.businessType}}`
- `{{1.contactEmail}}`
- a link to the Drive folder from step 3

**7. Send a test**

Run the scenario once so it listens, then submit the form locally. Make will
capture the payload and show you the field structure.

---

## Environment variables

Copy `.env.example` to `.env.local`:

| Variable | What it is |
| --- | --- |
| `MAKE_WEBHOOK_URL` | The URL from step 1 |
| `MAKE_WEBHOOK_SECRET` | Any long random string — `openssl rand -hex 32` |

Neither is prefixed `NEXT_PUBLIC_`, so neither reaches the browser. Set both in
Vercel's project settings for the deployed version.

---

## Branding

Styled with the **Clinic Evo design system**, taken from the design system
package (`Clinic Evo Design System.zip`), which was itself extracted from the
marketing site at [SAI-PHER584/Clinic-Evo](https://github.com/SAI-PHER584/Clinic-Evo).
Check there for fresher tokens if the brand moves on.

| | |
| --- | --- |
| Ink | `#0D1B2A` navy |
| Paper | `#FFFFFF` |
| Accent | `#FF5B4A` coral (hover `#E04535`) |
| Accent wash | `#FFF1EF` |
| Hairline | `#E5E7EB` |
| Body type | DM Sans, line-height 1.75 |
| Display type | Plus Jakarta Sans SemiBold |
| Radii | 6px inputs, 4px buttons, 14px cards |

Tokens live in `app/globals.css`, each annotated with the DS token it maps to.

**Fonts are the real brand binaries**, copied from the design system into
`app/fonts/` and loaded with `next/font/local` — not Google Fonts substitutes.
Brume is deliberately not loaded; per the DS it is wordmark-only, and the
wordmark here is the logo image in `public/brand/`.

The **arrow glyph** on the primary button is the DS's exact path
(`M3 7h8M7 3l4 4-4 4`) rather than a Phosphor arrow — the DS calls this out
specifically as the brand's one interaction icon. Other icons are Phosphor at
regular weight, per the DS.

Two deliberate departures from the DS, both noted in the code:

- **The grain overlay is one fixed layer**, not per-section as the DS applies
  it. Same 0.04 opacity and animation; fixed so it never repaints on scroll.
- **Step transitions animate transform only, not opacity.** The DS fade-up is
  `opacity 0→1` plus `y: 24→0`, but a backgrounded tab pauses the animation
  frame loop, and a frozen fade leaves the step unreadable. A frozen translate
  is a harmless offset. This follows the DS's own principle that motion is a
  polish layer and never load-bearing.

Copy follows the DS voice: sentence case, plain-spoken, no exclamation points,
no emoji.

---

## Editing the questions

Everything the client is asked lives in `lib/schema.ts`. The UI renders whatever
it finds there, so adding a question means adding an object — no component
changes.

```ts
{
  id: "parkingNotes",
  label: "Is parking going to be a problem for clients?",
  type: "textarea",
  rows: 3,
  showIf: (v) => v.businessType !== "Personal trainer or coach",
}
```

`showIf` receives the current answers and decides whether the field renders.
That is how clinics avoid being asked about class timetables, and personal
trainers avoid being asked which insurers they accept.

Field types: `text`, `email`, `tel`, `url`, `textarea`, `radio`, `checkbox`,
and `access` (the checklist, which renders once and is driven by
`ACCESS_ITEMS`).

Steps are the `STEPS` array. Reordering it reorders the form.

---

## Why no password fields

The form asks clients to **grant access to an email address** rather than send
credentials. Each item on the access checklist explains how, and gets marked
*Granted*, *Will do*, *Do not have* or *Need help*.

This is deliberate:

- A Drive document is not a vault. Anyone with folder access reads every
  credential in plaintext.
- Passwords go stale. Access invitations survive the client changing theirs.
- Storing client passwords is a liability you gain nothing from carrying.
- Health and fitness clients hold patient records. A blanket "send us your
  logins" prompt will eventually deliver practice-management credentials —
  Cliniko, Jane, Pabau, Semble — which sit on top of medical data. The access
  step warns against this explicitly.

For the occasional legacy host with a single login and no sub-accounts, there is
one field for a **onetimesecret.com** link. Those expire and can only be viewed
once, so nothing durable is stored. Open them promptly.

If you later decide you do want plaintext password fields, add them in
`lib/schema.ts` — but route them somewhere more restricted than the client
folder, and purge after handover.

---

## Things deliberately left out

**File uploads.** The form asks for a Drive/Dropbox/WeTransfer link instead.
Logo files and photo libraries are routinely larger than a serverless function
should handle, and a link is what most clients send anyway. If you want real
uploads later, Vercel Blob into the Assets folder is the path.

**A database.** Submissions go straight to Drive. If you later want to see them
in one place, add a Google Sheets module to the same Make scenario rather than
introducing storage here.

---

## Notes

- Answers save to `localStorage` as the client types, so a closed tab is not a
  lost form. The draft clears on successful submission.
- The page is `noindex`.
- Steps already completed can be revisited from the left rail; steps ahead
  cannot be skipped to.
