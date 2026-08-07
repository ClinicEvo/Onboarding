/**
 * The onboarding question set.
 *
 * Two separate forms, sent weeks apart:
 *
 * - `STEPS` is Stage 1, sent the day a client signs. Deliberately short. It
 *   asks only what cannot be researched and what is needed to start; anything
 *   Clinic Evo can find out for itself, or should be discussing in the kickoff
 *   call, is not here. The full discovery checklist lives in docs/ instead.
 * - `ACCESS_STEP` is Stage 2, sent after the kickoff, once there is enough
 *   trust to ask for logins.
 *
 * `showIf` receives the current answers and returns whether to render the
 * field. Used to keep the access list down to what each client actually has.
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

export type Values = Record<string, string | string[]>;

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

/* ------------------------------------------------ Stage 1: the short form */

export const STEPS: Step[] = [
  {
    id: "start",
    title: "Tell us about your clinic",
    blurb:
      "Enough for us to get started — about five minutes. We will research the rest ourselves and go through it with you on the kickoff call.",
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
      },
      { id: "contactName", label: "Main contact", type: "text", required: true },
      { id: "contactEmail", label: "Email", type: "email", required: true },
      { id: "contactPhone", label: "Phone", type: "tel" },
      {
        id: "existingSite",
        label: "Your current website",
        type: "url",
        placeholder: "https://",
        help: "If you have one. We will review it before we speak.",
      },
      {
        id: "locations",
        label: "Where do you operate?",
        type: "textarea",
        rows: 3,
        help: "Full address for each location, or say online only.",
      },
      {
        id: "services",
        label: "What services do you offer?",
        type: "textarea",
        required: true,
        rows: 5,
        help: "A list is fine. Prices too if they are straightforward.",
      },
      {
        id: "priorityServices",
        label: "Which of those matter most commercially?",
        type: "textarea",
        rows: 3,
        help: "The ones you would most like more of — because of margin, capacity, or because you enjoy the work.",
      },
      {
        id: "bookingSystem",
        label: "How do patients book?",
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
        id: "improve",
        label: "What would you most like us to improve?",
        type: "textarea",
        required: true,
        rows: 4,
        help: "In your own words. The thing that made you pick up the phone.",
      },
      {
        id: "incumbent",
        label: "Is anyone currently looking after your website or marketing?",
        type: "textarea",
        rows: 3,
        help: "An agency, a freelancer, a family member who built it years ago. Worth knowing early — handovers take longer than the work itself.",
      },
      {
        id: "timing",
        label: "Anything happening soon we should know about?",
        type: "textarea",
        rows: 3,
        help: "A new practitioner starting, a location opening, a quiet season you want to fix before it arrives.",
      },
      {
        id: "assetsLink",
        label: "Your logo and photos",
        type: "url",
        placeholder: "https://",
        help: "A Drive, Dropbox or WeTransfer link is easiest. If you would rather send them another way, or do not have much, leave this and we will sort it out together.",
      },
      { id: "anythingElse", label: "Anything else we should know?", type: "textarea", rows: 4 },
    ],
  },
];

/* --------------------------------------------- Stage 2: the access request */

/** Where ad platform access has to be sent. */
const ADS_EMAIL = "dmorgan18@googlemail.com";

const YES = "Yes";

const runsAds = (v: Values) => v.adAccounts === YES;
const takesPayments = (v: Values) => v.onlinePayments === YES;
const sendsNewsletters = (v: Values) => v.newsletters === YES;

export interface AccessItem {
  id: string;
  label: string;
  how: string;
  /**
   * Grant this one to a specific address instead of the email given at the top
   * of the step. The ad platforms go to Danny rather than the studio address,
   * so the row has to say so or the client will invite the wrong one.
   */
  grantTo?: string;
  showIf?: (v: Values) => boolean;
}

export const ACCESS_ITEMS: AccessItem[] = [
  {
    id: "registrar",
    label: "Your domain name",
    how: "Whoever you bought the domain from — often GoDaddy, 123-reg or Namecheap. They all have a way to add a second person. If you are not sure who it is with, say so and we will find out.",
  },
  {
    id: "hosting",
    label: "Web hosting",
    how: "The company the website actually sits on, which is sometimes the same as the domain. Most allow a second login.",
  },
  {
    id: "website",
    label: "Your website login",
    how: "In WordPress: Users, Add New, set the role to Administrator. Squarespace, Wix and Webflow all have an equivalent invite.",
  },
  {
    id: "gbp",
    label: "Google Business Profile",
    how: "The listing that shows on Google Maps. Business Profile, Settings, People and access, Add, then Manager.",
  },
  {
    id: "ga4",
    label: "Google Analytics",
    how: "Admin, Property access management, add our email as Editor. Plenty of clinics do not have this set up — that is fine, we will create it.",
  },
  {
    id: "gsc",
    label: "Google Search Console",
    how: "Settings, Users and permissions, Add user, Full. Same as above — if it does not exist we will set it up.",
  },
  {
    id: "meta",
    label: "Facebook and Instagram",
    how: "Meta Business Suite, Settings, People, invite our email with Content access. This is your pages, not advertising.",
  },
  {
    id: "booking",
    label: "Booking system",
    how: "Add us as a staff or admin user, so we can connect booking to the new site.",
  },
  {
    id: "gtm",
    label: "Google Tag Manager",
    how: "Admin, User Management, the + button, then Publish permission. Only relevant if someone set this up for you previously.",
    showIf: runsAds,
  },
  {
    id: "google-ads",
    label: "Google Ads",
    how: "Admin, Access and security, the + button, enter the email and choose Admin. Google sends an invitation that needs accepting, so it will not show as active immediately.",
    grantTo: ADS_EMAIL,
    showIf: runsAds,
  },
  {
    id: "meta-ads",
    label: "Meta Ads account",
    how: "Meta Business Suite, Settings, Ad accounts, pick the account, Add people, then Manage campaigns. Separate from your pages above.",
    grantTo: ADS_EMAIL,
    showIf: runsAds,
  },
  {
    id: "tiktok-ads",
    label: "TikTok Ads",
    how: "TikTok Ads Manager, Assets, Users, Invite, choose Admin.",
    grantTo: ADS_EMAIL,
    showIf: runsAds,
  },
  {
    id: "email",
    label: "Email marketing",
    how: "Mailchimp, Klaviyo, Brevo and similar all let you invite a second user.",
    showIf: sendsNewsletters,
  },
  {
    id: "payments",
    label: "Payments",
    how: "Stripe, Settings, Team, invite as Developer.",
    showIf: takesPayments,
  },
];

export const ACCESS_STATUSES = [
  "Done",
  "Will do",
  "Do not have one",
  "Not sure — help me",
] as const;

export const ACCESS_STEP: Step = {
  id: "access",
  title: "Connecting your accounts",
  blurb:
    "We now need to connect the accounts we will be working on. We are not asking for any passwords — you invite us in, and you can remove us at any time.",
  fields: [
    {
      // Also what the brief gets filed under, so it is needed even though we
      // usually know it already — prefilled from the client link when there
      // is one.
      id: "businessName",
      label: "Business name",
      type: "text",
      required: true,
    },
    {
      id: "accessEmail",
      label: "Which email should we be invited under?",
      type: "email",
      required: true,
      help: "Use the one we gave you if you have it, otherwise leave your own and we will confirm.",
    },
    {
      id: "adAccounts",
      label: "Do you run paid ads?",
      type: "radio",
      required: true,
      options: [YES, "No", "Not sure"],
      help: "Google, Facebook, Instagram or TikTok. Say no if nobody is actively running them.",
    },
    {
      id: "onlinePayments",
      label: "Does your website take payments?",
      type: "radio",
      required: true,
      options: [YES, "No", "Not sure"],
      help: "Selling packages, gift vouchers or classes online, as opposed to taking payment in the clinic.",
    },
    {
      id: "newsletters",
      label: "Do you send newsletters or marketing emails?",
      type: "radio",
      required: true,
      options: [YES, "No", "Not sure"],
    },
    { id: "accessGrants", label: "Accounts", type: "access" },
    {
      id: "patientPulseEmail",
      label: "Which email should we send your Patient Pulse login to?",
      type: "email",
      help: "This one is the other way round — we send you the invitation. Use whichever address the person handling day-to-day follow-up will read.",
    },
    {
      id: "secretLink",
      label: "Anything that cannot be shared by invitation",
      type: "url",
      placeholder: "https://onetimesecret.com/secret/...",
      help: "A few older systems have one login and no way to add a second person. For those only: put the details into onetimesecret.com, set it to expire in 7 days, and paste the link here. Please do not type a password into this form.",
    },
    {
      id: "accessNotes",
      label: "Anything holding you up?",
      type: "textarea",
      rows: 3,
      help: "A previous agency who will not hand over, an account set up by someone who has left, a login nobody can find. All very common. Tell us and we will work around it.",
    },
  ],
};

/** Fields visible for the current answers, per step. */
export function visibleFields(step: Step, values: Values): Field[] {
  return step.fields.filter((f) => !f.showIf || f.showIf(values));
}

/** Access rows that apply to this client's answers. */
export function visibleAccessItems(values: Values): AccessItem[] {
  return ACCESS_ITEMS.filter((i) => !i.showIf || i.showIf(values));
}
