# Client onboarding

Onboarding for new Clinic Evo clients — clinics, solo practitioners, personal
trainers, gyms and studios. Answers land in the client's OneDrive folder as a
Word brief, and both founders get an email.

It collects **access grants, not passwords**. See [Why no password fields](#why-no-password-fields).

---

## One form, four steps

| Step | What it asks |
| --- | --- |
| The basics | Name, type, contact, locations |
| Your business | Services, commercial priorities, booking system, what to improve |
| Your website | Current site, who looks after it, sites they like, photos, assets |
| Access | One scope question, then all 14 accounts |

About ten minutes. The rule for what earns a place: **only ask what the client
genuinely knows better than us** — their business, their taste, their accounts.

An earlier version asked 57 questions across 8 steps. Most were cut, not
because they were bad questions but because they were our homework, not the
client's: pages the site needs, features, competitor lists, brand adjectives.
Recommending those is the job they are paying for. The one taste question that
survived is *websites you like the look of* — nobody knows what a client finds
beautiful except the client.

Everything cut lives in [`docs/questions.md`](docs/questions.md)'s companion —
the master discovery checklist — and in the kickoff conversation, where answers
are richer than textareas.

All 14 accounts are always on display. An earlier version hid the ones a
client said they did not have, which sounds kinder but means a clinic never sees
the shape of what Clinic Evo actually works on — and hiding TikTok because
somebody answered "no" to a filter question is a worse outcome than showing it
and letting them mark **Do not have one**.

Two things carry the weight instead: **Not sure — help me** is a first-class
answer rather than an admission of failure, and every row names exactly which
email to invite, so nobody has to guess or remember.

The one scope question left is *are we going to be helping you with paid ads?*
It filters nothing. It tells the brief whether an unanswered Google Ads row is
irrelevant or a job — if ads are in scope and a platform is marked
**Do not have one**, the brief flags it as an account to create.

Those addresses are split by who does the work, not by category:

| Address | Rows |
| --- | --- |
| `simon@clinicevolution.com` | Domain, hosting, website login, Analytics, Search Console, Tag Manager, booking, newsletter, payments |
| `dmorgan18@googlemail.com` | Google Business Profile, Facebook/Instagram, Google Ads, Meta Ads |
| `danny@clinicevolution.com` | TikTok Ads |

Both of Danny's addresses are deliberately in use — the Google and Meta ad
platforms are tied to his Gmail, TikTok to his work address. Worth knowing
before "tidying" them into one.

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
Client fills the form
      │
      ▼
POST /api/submit          validates, renders the brief, adds the shared secret
      │
      ▼
Make webhook              filter rejects anything with the wrong secret
      │
      └─►  OneDrive: Master Folder/Clients/<Business>/
                     └── <Business> — onboarding brief.docx
                     (folder reused if it exists, created if not)
```

The Make webhook URL never reaches the browser. If it did, anyone could read it
out of the page source and post junk straight into the Drive.

---

## The Make scenario

Already built and running — **Clinic Evo — onboarding submissions**, scenario
`9627307` in Make team 297679 (`eu2.make.com`). Two modules:

| # | Module | What it does |
| --- | --- | --- |
| 1 | Custom webhook | Receives the submission. Hook `4302421`. |
| 3 | OneDrive → Upload a File | Writes the brief by **path**. Carries the security filter. |
| 6 | OneDrive → Get a Share Link | Anonymous **edit** link to the client folder, so they can upload assets. |
| 4 | Microsoft 365 Email → Send an Email | Notifies Simon, CC Danny, with both links. |

(Module numbering is not sequential — 2 was the original create-folder module,
removed when path upload replaced it. Execution order is the table order.)

Module 6's link lets **anyone who has it** upload into that client's folder, so
the email says to forward it only to the client. It is generated per submission
and included in the notification rather than shown on the form, because the
folder does not exist until the submission is processed. Anonymous sharing is
permitted on this tenant — verified — but if that policy ever changes the link
comes through blank and the `Ignore` handler stops it breaking the run.

Module 2 addresses the destination as a path rather than a folder ID:

```
folder    /Master Folder/Clients/{{1.folderName}}
filename  {{1.briefFilename}}
data      {{toBinary(1.briefDocx; "base64")}}
```

**Addressing by path is what makes returning clients work.** OneDrive reuses the
folder when it already exists and creates it when it does not, so a brief for an
existing client lands inside their real folder instead of creating a duplicate
alongside it. Both cases are verified against the live form. It also means no
separate create-folder module, so each submission costs two Make operations
rather than three.

This is why `folderName` in `app/api/submit/route.ts` strips only the characters
OneDrive genuinely forbids (`" * : < > ? / \ |`). Anything more aggressive
mangles real client names — `1% Club` and `Elliot Nation (Body-Restore)` have to
survive verbatim or the path will not match the folder that already exists.

**The filter on module 2 is the only thing protecting the webhook.** It compares
`{{1.secret}}` against the shared secret; anything else stops there. The secret
travels in the request body rather than a header because Make matches body
fields far more reliably than hyphenated header names — equally private either
way over HTTPS.

**The brief is a real Word document.** It is built in `lib/docx.ts` with proper
headings, bold field labels and a table for the access checklist, then sent
base64 encoded. `toBinary(...; "base64")` decodes it back to bytes before
upload — without that Make would write the base64 text into the file and Word
could not open it. Sanity check if it ever looks wrong: a correct upload is
around 10KB, the base64 text would be nearer 14KB.

`lib/brief.ts` still renders the same content as Markdown. Nothing files it any
more, but it is what the local dev log prints and it is far easier to eyeball
than a Word file when checking a change to the question set.

There is no template document to maintain and no placeholder mapping to keep in
sync with the questions — both renderers walk `STEPS` directly, so a new
question appears in the brief automatically.

The OneDrive connection is Microsoft OAuth as `Simon@clinicevolution.com`. Note
that connections can only be created **from inside a scenario module** in the
current Make UI — the Connections settings page has no add button.

### About the drive target

`Master Folder` lives in **Danny's** OneDrive, not Simon's, so module 2 addresses
it by explicit Drive ID rather than using Make's "My Drive" default:

```
drive  b!GxTpz6BN9E-Jkr1Y1bkw4HWbs_1bOmBIot-suIe2ccpcWMTHWzSbRY7zjuKfRCSQ
```

This works because Danny shares that folder with Simon and the connection is
Simon's. **It therefore depends on two people's accounts** — if either changes,
or Danny unshares, submissions fail. They will fail loudly in Make's execution
log rather than silently, but they will fail. Moving client records to a
SharePoint team site and repointing module 2 there would remove that dependency,
and is the better long-term home.

### The notification, and its error handler

Module 4 emails `Simon@clinicevolution.com` on every submission, CC'ing
`danny@clinicevolution.com` — business name, type, contact, where it filed, and
a link straight to the brief. Because it is sent from Simon to Simon it lands in
both Inbox and Sent Items, which is normal.

**Module 4 has an `Ignore` error handler and that is deliberate.** A failing
notification must never cost a submission: without it, a mail error aborts the
run *after* the brief has been written, marking a perfectly good submission as
failed. With it, the send is attempted, any failure is swallowed and the run
completes. Verified both ways — with module 4 unconnected the run still returned
status 1 with the file correctly written.

The trade-off is that a broken notification is silent, since the run reports
success either way. If emails ever stop arriving, check module 4's connection
first rather than the execution log.

**A scope gotcha worth remembering.** Microsoft connections in Make carry only
the scopes requested by the module that created them. This connection was made
from the OneDrive module, so it had file scopes but not `Mail.Send`, and the
email module returned `[403] Access is denied` until it was reauthorised. Adding
a Microsoft module that needs a permission the existing connection lacks will
fail the same way — reauthorise the connection from the new module.

---

## Environment variables

Copy `.env.example` to `.env.local` for local work; both are already set in
Vercel for the deployed site.

| Variable | What it is |
| --- | --- |
| `MAKE_WEBHOOK_URL` | The custom webhook's URL from Make |
| `MAKE_WEBHOOK_SECRET` | Long random string — `openssl rand -hex 32`. Must match the filter on module 2. |
| `CLIENT_CODES` | Per-client access codes. See below. Optional. |

---

## Per-client links

Each client gets their own link:

```
https://onboarding-clinic-evo.vercel.app/?c=onepercent
```

Set the codes in `CLIENT_CODES`, comma- or newline-separated:

```
CLIENT_CODES="onepercent=1% Club,bodyrestore=Elliot Nation (Body-Restore)"
```

The name on the right **must match the OneDrive folder exactly**, because it is
what the brief gets filed under.

That is the more important half of this feature. Without it the folder is named
from whatever the client types, so someone from 1% Club writing "The 1 Percent
Club" gets a brand new folder beside their real one. With a code, they can type
anything they like and it still files correctly — the typed name is kept in the
brief, it just does not decide the folder. The business-name field is also
prefilled from the list, so most clients never touch it.

The gate is enforced in two places. The page refuses to render the form without
a valid code, and `/api/submit` checks it again independently — anything can
POST to that route directly, so it cannot trust the page that rendered the form.

**If `CLIENT_CODES` is unset the form is open to anyone**, which is how it
behaved before this existed. Setting it turns gating on. Codes are
case-insensitive.

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

Everything the client is asked lives in `lib/schema.ts`. The UI renders whatever it finds there, so adding
a question means adding an object, with no component changes.

**Before adding to Stage 1, ask whether it belongs there at all.** Could you find
this out yourself? Is it better asked in the kickoff call? Stage 1 got long once
already, and the pressure is always in that direction, because every question
seems individually reasonable.

Run `npm run questions` after any change — it regenerates the reference in
`docs/`.

```ts
{
  id: "parkingNotes",
  label: "Is parking going to be a problem for clients?",
  type: "textarea",
  rows: 3,
  showIf: (v) => v.businessType !== "Personal trainer or coach",
}
```

`showIf` receives the current answers and decides whether the field renders. On
the access form it is what keeps the account list down: three questions about
ads, payments and newsletters, and a typical clinic sees 8 accounts rather than
14. Nobody should have to work out whether they have Tag Manager.

Field types: `text`, `email`, `tel`, `url`, `textarea`, `radio`, `checkbox`,
and `access` (the checklist, which renders once and is driven by
`ACCESS_ITEMS`).

Access rows take two optional extras beyond `how`:

- `grantTo` — a specific address for that row, shown in place of the email at
  the top of the step. The ad platforms use this because they go to
  `dmorgan18@googlemail.com`, not the studio address, and without it clients
  invite the wrong one.
- `showIf` — same conditional logic as fields. The ad platform rows use it so
  they only appear for clients who answered that they already have ad accounts.
  Clients who ask for help setting them up get flagged in the brief instead.

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
