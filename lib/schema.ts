/**
 * The onboarding question set.
 *
 * This file is the single source of truth for what the client is asked.
 * Edit here to change the form — the UI renders whatever it finds.
 *
 * `showIf` receives the current answers and returns whether to render the
 * field. Use it to keep clinics from being asked about class timetables and
 * personal trainers from being asked about insurers.
 */

export type BusinessType =
  | "Clinic or multi-practitioner practice"
  | "Solo practitioner"
  | "Personal trainer or coach"
  | "Gym, studio or class-based"
  | "Something else";

export const BUSINESS_TYPES: BusinessType[] = [
  "Clinic or multi-practitioner practice",
  "Solo practitioner",
  "Personal trainer or coach",
  "Gym, studio or class-based",
  "Something else",
];

/** Types where the practitioner is likely to be statutorily regulated. */
const CLINICAL: BusinessType[] = [
  "Clinic or multi-practitioner practice",
  "Solo practitioner",
];

/** Types built around sessions, programmes and classes rather than appointments. */
const COACHING: BusinessType[] = [
  "Personal trainer or coach",
  "Gym, studio or class-based",
];

export type Values = Record<string, string | string[]>;

const is = (v: Values, list: BusinessType[]) =>
  list.includes(v.businessType as BusinessType);

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "url"
  | "textarea"
  | "radio"
  | "checkbox"
  | "access";

export interface Field {
  id: string;
  label: string;
  type: FieldType;
  help?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  rows?: number;
  showIf?: (v: Values) => boolean;
}

export interface Step {
  id: string;
  title: string;
  blurb: string;
  fields: Field[];
}

/**
 * Access items the client is asked to *grant*, not to send passwords for.
 * `appliesTo` narrows the list by business type; omit it to always show.
 */
export interface AccessItem {
  id: string;
  label: string;
  how: string;
  appliesTo?: BusinessType[];
  /**
   * Grant this one to a specific address instead of the email given at the top
   * of the access step. The ad platforms go to Danny rather than the studio
   * address, so the row has to say so or the client will invite the wrong one.
   */
  grantTo?: string;
  showIf?: (v: Values) => boolean;
}

/** Where ad platform access has to be sent. */
const ADS_EMAIL = "dmorgan18@googlemail.com";

const HAS_AD_ACCOUNTS = "Yes, they are already set up";

/** Ad platform rows only apply when the client actually has ad accounts. */
const runsAds = (v: Values) => v.adAccounts === HAS_AD_ACCOUNTS;

export const ACCESS_ITEMS: AccessItem[] = [
  {
    id: "registrar",
    label: "Domain registrar",
    how: "Invite us as a user, or move the domain into your own account and add us. GoDaddy, 123-reg, Namecheap and Cloudflare all support this.",
  },
  {
    id: "hosting",
    label: "Web hosting",
    how: "Most hosts allow a second login or sub-account. If yours does not, use the one-time link at the bottom of this page.",
  },
  {
    id: "website",
    label: "Existing website admin",
    how: "In WordPress: Users, Add New, set role to Administrator. Squarespace, Wix and Webflow have an equivalent invite.",
  },
  {
    id: "gbp",
    label: "Google Business Profile",
    how: "Business Profile, Settings, People and access, Add, then choose Manager.",
  },
  {
    id: "ga4",
    label: "Google Analytics",
    how: "Admin, Property access management, add our email as Editor.",
  },
  {
    id: "gsc",
    label: "Google Search Console",
    how: "Settings, Users and permissions, Add user, Full.",
  },
  {
    id: "meta",
    label: "Facebook and Instagram pages",
    how: "Meta Business Suite, Settings, People, invite our email with Content access. This covers your pages — ad accounts are separate, further down.",
  },
  {
    id: "gtm",
    label: "Google Tag Manager",
    how: "Admin, User Management, the + button, Add users, then give Publish permission on the container. If you have never heard of Tag Manager you almost certainly do not have one — mark it Do not have and we will set it up.",
  },
  {
    id: "google-ads",
    label: "Google Ads",
    how: "Admin, Access and security, the + button, enter the email and choose Admin. Google sends an invitation that has to be accepted, so it will not show as active straight away.",
    grantTo: ADS_EMAIL,
    showIf: runsAds,
  },
  {
    id: "meta-ads",
    label: "Meta Ads account",
    how: "Meta Business Suite, Settings, Ad accounts, pick the account, Add people, then turn on Manage campaigns. This is separate from page access above — granting one does not grant the other.",
    grantTo: ADS_EMAIL,
    showIf: runsAds,
  },
  {
    id: "tiktok-ads",
    label: "TikTok Ads",
    how: "TikTok Ads Manager, Assets, Users, Invite, and choose Admin.",
    grantTo: ADS_EMAIL,
    showIf: runsAds,
  },
  {
    id: "booking",
    label: "Booking system",
    how: "Add us as a staff or admin user so we can wire the booking flow into the new site.",
  },
  {
    id: "email",
    label: "Email marketing",
    how: "Mailchimp, Klaviyo, Brevo and similar all support inviting a second user.",
  },
  {
    id: "payments",
    label: "Payments",
    how: "Stripe, Settings, Team, invite as Developer. Only needed if the site takes payment.",
  },
];

export const STEPS: Step[] = [
  {
    id: "basics",
    title: "The basics",
    blurb: "Who you are and how we reach you. Everything after this adapts to what you pick here.",
    fields: [
      {
        id: "businessName",
        label: "Business name",
        type: "text",
        required: true,
        placeholder: "As you want it to appear on the site",
      },
      {
        id: "businessType",
        label: "What kind of business is this?",
        type: "radio",
        required: true,
        options: BUSINESS_TYPES,
        help: "This changes which questions you get asked, so it is worth getting right.",
      },
      {
        id: "businessTypeOther",
        label: "Tell us what you do",
        type: "text",
        showIf: (v) => v.businessType === "Something else",
      },
      { id: "contactName", label: "Main contact", type: "text", required: true },
      { id: "contactEmail", label: "Email", type: "email", required: true },
      { id: "contactPhone", label: "Phone", type: "tel" },
      {
        id: "locations",
        label: "Where do you operate?",
        type: "textarea",
        rows: 3,
        help: "Full address for each location, or say online only. Include parking and access notes if they matter to your clients.",
      },
      {
        id: "hours",
        label: "Opening hours",
        type: "textarea",
        rows: 3,
        help: "Per location if they differ.",
      },
      { id: "yearsTrading", label: "How long have you been trading?", type: "text" },
    ],
  },

  {
    id: "offer",
    title: "What you do",
    blurb: "The services themselves. Be specific — this is the raw material for most of the page copy.",
    fields: [
      {
        id: "services",
        label: "Your main services and what they cost",
        type: "textarea",
        required: true,
        rows: 6,
        help: "One per line with a price or price range. If pricing varies, say how.",
      },
      {
        id: "whoYouHelp",
        label: "Who is your ideal client?",
        type: "textarea",
        rows: 4,
        help: "Age, situation, what brought them to you. The more specific, the better the copy.",
      },
      {
        id: "conditions",
        label: "Conditions you commonly treat",
        type: "textarea",
        rows: 4,
        showIf: (v) => is(v, CLINICAL),
        help: "These often become individual pages, so list the ones you actually want to be found for.",
      },
      {
        id: "insurers",
        label: "Insurers you accept",
        type: "textarea",
        rows: 2,
        showIf: (v) => is(v, CLINICAL),
        help: "Bupa, AXA, Vitality, Aviva and so on. Include any registration numbers they issued you.",
      },
      {
        id: "delivery",
        label: "How do you deliver sessions?",
        type: "radio",
        options: ["In person only", "Online only", "Both in person and online"],
        showIf: (v) => is(v, COACHING),
      },
      {
        id: "packages",
        label: "Packages and programmes",
        type: "textarea",
        rows: 4,
        showIf: (v) => v.businessType === "Personal trainer or coach",
        help: "Block bookings, 12-week programmes, nutrition add-ons, whatever you sell beyond single sessions.",
      },
      {
        id: "timetable",
        label: "Class timetable",
        type: "textarea",
        rows: 4,
        showIf: (v) => v.businessType === "Gym, studio or class-based",
        help: "Paste it in, or link to where it currently lives. Tell us how often it changes.",
      },
      {
        id: "membership",
        label: "Membership tiers",
        type: "textarea",
        rows: 4,
        showIf: (v) => v.businessType === "Gym, studio or class-based",
        help: "What each tier includes, contract length, joining fees.",
      },
    ],
  },

  {
    id: "people",
    title: "Your people",
    blurb: "Who works with you. Credentials matter here — for trust, and in some cases for compliance.",
    fields: [
      {
        id: "practitioners",
        label: "Who works in the business?",
        type: "textarea",
        rows: 6,
        help: "Name, role, and a line or two about them. Include yourself.",
      },
      {
        id: "registrations",
        label: "Professional registrations",
        type: "textarea",
        rows: 4,
        showIf: (v) => is(v, CLINICAL),
        help: "GOsC, HCPC, CSP, GCC, BAcC and similar, with registration numbers. These usually have to be displayed, so we need them exactly right.",
      },
      {
        id: "certifications",
        label: "Qualifications and certifications",
        type: "textarea",
        rows: 4,
        showIf: (v) => is(v, COACHING),
        help: "CIMSPA, REPs, governing body awards, first aid, plus your public liability insurer.",
      },
      {
        id: "hiring",
        label: "Are you hiring?",
        type: "radio",
        options: ["Yes, and we want a careers page", "Not right now", "Maybe later"],
      },
    ],
  },

  {
    id: "current",
    title: "Where you are now",
    blurb: "Your current setup. We need to know what exists before we can plan what replaces it.",
    fields: [
      { id: "existingSite", label: "Current website", type: "url", placeholder: "https://" },
      {
        id: "siteLikes",
        label: "What works about it?",
        type: "textarea",
        rows: 3,
        showIf: (v) => Boolean(v.existingSite),
      },
      {
        id: "siteDislikes",
        label: "What does not?",
        type: "textarea",
        rows: 3,
        showIf: (v) => Boolean(v.existingSite),
      },
      {
        id: "keepContent",
        label: "Should we carry the existing content over?",
        type: "radio",
        options: ["Keep most of it", "Keep some, rewrite the rest", "Start fresh", "Not sure yet"],
        showIf: (v) => Boolean(v.existingSite),
      },
      { id: "domain", label: "Domain name", type: "text", placeholder: "yourpractice.co.uk" },
      {
        id: "registrar",
        label: "Who is the domain registered with?",
        type: "text",
        help: "GoDaddy, 123-reg, Namecheap, or whoever set it up for you. If you have no idea, say so.",
      },
      { id: "host", label: "Who hosts the current site?", type: "text" },
      {
        id: "bookingSystem",
        label: "Booking system",
        type: "radio",
        options: [
          "Cliniko",
          "Jane",
          "Pabau",
          "Semble",
          "WriteUpp",
          "TeamUp",
          "Glofox",
          "Mindbody",
          "Calendly or Acuity",
          "Phone and email only",
          "Other",
        ],
      },
      {
        id: "bookingOther",
        label: "Which one?",
        type: "text",
        showIf: (v) => v.bookingSystem === "Other",
      },
      {
        id: "social",
        label: "Social profiles",
        type: "textarea",
        rows: 3,
        help: "Links to everything you actively use.",
      },
      {
        id: "reviews",
        label: "Where do your reviews live?",
        type: "textarea",
        rows: 2,
        help: "Google, Trustpilot, Facebook, Doctify. We can usually pull these onto the site.",
      },
    ],
  },

  {
    id: "goals",
    title: "The new site",
    blurb: "What it needs to achieve, and what it should feel like.",
    fields: [
      {
        id: "primaryGoal",
        label: "What is the single most important thing the new site must do?",
        type: "radio",
        required: true,
        options: [
          "Get more bookings or enquiries",
          "Look credible and established",
          "Rank better in search",
          "Sell products or programmes online",
          "Replace something outdated and embarrassing",
        ],
      },
      {
        id: "successMetric",
        label: "How will you know it worked?",
        type: "textarea",
        rows: 3,
        help: "A number if you have one. Twenty enquiries a month, a full timetable, whatever it is.",
      },
      {
        id: "pages",
        label: "Pages you know you need",
        type: "checkbox",
        options: [
          "Home",
          "About",
          "Services overview",
          "Individual service pages",
          "Conditions we treat",
          "Meet the team",
          "Pricing",
          "Timetable",
          "Book online",
          "Contact",
          "Blog or advice",
          "FAQs",
          "Testimonials",
          "Shop",
          "Careers",
        ],
      },
      {
        id: "features",
        label: "Features it must have",
        type: "checkbox",
        options: [
          "Online booking",
          "Class timetable",
          "Online payments",
          "Member or client area",
          "Gift vouchers",
          "Blog",
          "Newsletter signup",
          "Live chat",
          "Multi-location support",
          "Intake forms",
        ],
      },
      {
        id: "sitesLiked",
        label: "Sites you like",
        type: "textarea",
        rows: 3,
        help: "Any industry, not just yours. Tell us what specifically you like about each.",
      },
      {
        id: "sitesDisliked",
        label: "Sites you dislike",
        type: "textarea",
        rows: 2,
        help: "Genuinely useful. Knowing what to avoid saves a round of revisions.",
      },
      {
        id: "competitors",
        label: "Your main competitors",
        type: "textarea",
        rows: 3,
        help: "Who else would your client be considering?",
      },
      {
        id: "tone",
        label: "How should it come across?",
        type: "checkbox",
        options: [
          "Warm and reassuring",
          "Clinical and precise",
          "Premium",
          "Energetic",
          "Calm",
          "No-nonsense",
          "Down to earth",
          "Playful",
        ],
        help: "Pick two or three. Picking everything tells us nothing.",
      },
    ],
  },

  {
    id: "brand",
    title: "Brand and assets",
    blurb: "The raw materials. Missing assets are the most common reason a build stalls, so flag gaps now.",
    fields: [
      {
        id: "logo",
        label: "Do you have a logo?",
        type: "radio",
        options: [
          "Yes, and I have the original vector files",
          "Yes, but only as a JPG or PNG",
          "No, we need one designed",
        ],
      },
      { id: "brandColours", label: "Brand colours", type: "text", help: "Hex codes if you have them." },
      { id: "brandFonts", label: "Brand fonts", type: "text" },
      {
        id: "photography",
        label: "Photography",
        type: "radio",
        options: [
          "Professional shots of the space and team",
          "Decent phone photos",
          "Nothing usable yet",
          "We want to arrange a shoot",
        ],
        help: "Stock photography of models in gyms is the fastest way to look like everyone else. Real photos of your actual space are worth the effort.",
      },
      {
        id: "assetsLink",
        label: "Link to your assets",
        type: "url",
        placeholder: "https://",
        help: "Drop your logo files, photos and any existing brand guidelines into Drive, Dropbox or WeTransfer and paste the share link here. Please make sure the link does not expire.",
      },
      { id: "assetNotes", label: "Anything we should know about the assets?", type: "textarea", rows: 3 },
    ],
  },

  {
    id: "access",
    title: "Access",
    blurb:
      "We do not want your passwords. Grant access to the email below instead — it is safer for you, it survives password changes, and you can revoke it the moment the project ends.",
    fields: [
      {
        id: "accessEmail",
        label: "Which email should we be granted access under?",
        type: "email",
        required: true,
        help: "Use ours if we have given you one, otherwise leave your own and we will confirm.",
      },
      {
        id: "adAccounts",
        label: "Do you run paid ads?",
        type: "radio",
        options: [
          HAS_AD_ACCOUNTS,
          "No, and we would like help setting them up",
          "No, and we are not planning to",
        ],
        help: "Google Ads, Meta, TikTok. Say no if you are unsure — plenty of clinics have an account someone set up years ago and never used, and we would rather start clean than inherit that.",
      },
      { id: "accessGrants", label: "Access checklist", type: "access" },
      {
        id: "patientPulseEmail",
        label: "Which email should we send Patient Pulse access to?",
        type: "email",
        help: "This one is the other way round — we send you the invitation. Use whichever address the person running day-to-day follow-up will actually read.",
      },
      {
        id: "secretLink",
        label: "One-time link for anything that cannot be shared by invite",
        type: "url",
        placeholder: "https://onetimesecret.com/secret/...",
        help: "Some older hosts have a single login and no way to add a second user. For those only: put the details into onetimesecret.com, set it to expire in 7 days, and paste the generated link here. Never type a password directly into this form.",
      },
      {
        id: "accessNotes",
        label: "Anything blocking you on access?",
        type: "textarea",
        rows: 3,
        help: "Agency who will not hand over, ex-colleague who set it all up, forgotten accounts. Very common. Tell us and we will work around it.",
      },
    ],
  },

  {
    id: "practical",
    title: "Practicalities",
    blurb: "Timings, decisions and anything else on your mind.",
    fields: [
      { id: "deadline", label: "Is there a date this needs to be live by?", type: "text", help: "And what happens on that date?" },
      {
        id: "budgetAgreed",
        label: "Has a budget been agreed?",
        type: "radio",
        options: ["Yes, in the proposal", "Roughly", "Not yet"],
      },
      {
        id: "decisionMakers",
        label: "Who signs things off?",
        type: "text",
        help: "Everyone whose approval is needed before we can proceed. Naming them now avoids surprises at week six.",
      },
      {
        id: "contentOwner",
        label: "Who is writing the content?",
        type: "radio",
        options: ["You write it", "We write it", "A mix, and we will agree who does what"],
      },
      {
        id: "compliance",
        label: "Any claims or compliance points we should know about?",
        type: "textarea",
        rows: 4,
        help: "Advertising rules are strict on health claims, so tell us about anything you currently say about results, cures or outcomes. Also mention any existing privacy policy or cookie setup.",
      },
      { id: "anythingElse", label: "Anything else?", type: "textarea", rows: 4 },
    ],
  },
];

/** Fields visible for the current answers, per step. */
export function visibleFields(step: Step, values: Values): Field[] {
  return step.fields.filter((f) => !f.showIf || f.showIf(values));
}

/** Access rows that apply to this client's business type and answers. */
export function visibleAccessItems(values: Values): AccessItem[] {
  const t = values.businessType as BusinessType;
  return ACCESS_ITEMS.filter(
    (i) =>
      (!i.appliesTo || !t || i.appliesTo.includes(t)) &&
      (!i.showIf || i.showIf(values)),
  );
}

export const ACCESS_STATUSES = ["Granted", "Will do", "Do not have", "Need help"] as const;
