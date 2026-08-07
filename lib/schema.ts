/**
 * The onboarding question set.
 *
 * One form, four steps. The rule for what earns a place: only ask what the
 * client genuinely knows better than us — their business, their taste, their
 * accounts. Anything we can research (competitors, their rankings, their
 * sitemap) and anything we should be recommending (pages, features, IA) is
 * deliberately absent; the master discovery checklist in docs/ covers those
 * for the kickoff call.
 *
 * `showIf` receives the current answers and returns whether to render the
 * field. On the access step it keeps the account list down to what each
 * client actually has.
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

/* ------------------------------------------------------------ Access items */

/** Everything web — site, domain, Google properties, newsletters. */
const WEB_EMAIL = "hi.neometa@gmail.com";
/** The ad platforms only. */
const ADS_EMAIL = "dmorgan18@googlemail.com";

const HAS_ADS = "Yes, they are already set up";
const WANTS_ADS_HELP = "No — and we would like help setting them up";

const runsAds = (v: Values) => v.adAccounts === HAS_ADS;
const takesPayments = (v: Values) => v.onlinePayments === "Yes";
const sendsNewsletters = (v: Values) => v.newsletters === "Yes";

export interface AccessItem {
  id: string;
  label: string;
  how: string;
  /** The address the client should invite for this row. */
  grantTo: string;
  showIf?: (v: Values) => boolean;
}

export const ACCESS_ITEMS: AccessItem[] = [
  {
    id: "registrar",
    label: "Your domain name",
    how: "Whoever you bought the domain from — often GoDaddy, 123-reg or Namecheap. They all have a way to add a second person. Not sure who it is with? Say so and we will find out.",
    grantTo: WEB_EMAIL,
  },
  {
    id: "hosting",
    label: "Web hosting",
    how: "The company the website actually sits on, sometimes the same as the domain. Most allow a second login.",
    grantTo: WEB_EMAIL,
  },
  {
    id: "website",
    label: "Your website login",
    how: "In WordPress: Users, Add New, set the role to Administrator. Squarespace, Wix and Webflow all have an equivalent invite.",
    grantTo: WEB_EMAIL,
  },
  {
    id: "gbp",
    label: "Google Business Profile",
    how: "The listing that shows on Google Maps. Business Profile, Settings, People and access, Add, then Manager.",
    grantTo: WEB_EMAIL,
  },
  {
    id: "ga4",
    label: "Google Analytics",
    how: "Admin, Property access management, add the email as Editor. Plenty of clinics do not have this set up — that is fine, we will create it.",
    grantTo: WEB_EMAIL,
  },
  {
    id: "gsc",
    label: "Google Search Console",
    how: "Settings, Users and permissions, Add user, Full. If it does not exist we will set it up.",
    grantTo: WEB_EMAIL,
  },
  {
    id: "meta",
    label: "Facebook and Instagram",
    how: "Meta Business Suite, Settings, People, invite the email with Content access. This is your pages, not advertising.",
    grantTo: WEB_EMAIL,
  },
  {
    id: "booking",
    label: "Booking system",
    how: "Add us as a staff or admin user, so we can connect booking to the new site.",
    grantTo: WEB_EMAIL,
  },
  {
    id: "gtm",
    label: "Google Tag Manager",
    how: "Admin, User Management, the + button, then Publish permission. Only relevant if someone set this up for you previously.",
    grantTo: WEB_EMAIL,
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
    label: "Newsletter software",
    how: "Mailchimp, Klaviyo, Brevo and similar all let you invite a second user.",
    grantTo: WEB_EMAIL,
    showIf: sendsNewsletters,
  },
  {
    id: "payments",
    label: "Payments",
    how: "Stripe, Settings, Team, invite as Developer.",
    grantTo: WEB_EMAIL,
    showIf: takesPayments,
  },
];

export const ACCESS_STATUSES = [
  "Done",
  "Will do",
  "Do not have one",
  "Not sure — help me",
] as const;

/* ------------------------------------------------------------------- Steps */

export const STEPS: Step[] = [
  {
    id: "basics",
    title: "The basics",
    blurb: "Who you are and how we reach you.",
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
        id: "locations",
        label: "Where do you operate?",
        type: "textarea",
        rows: 3,
        help: "Full address for each location, or say online only.",
      },
    ],
  },

  {
    id: "business",
    title: "Your business",
    blurb:
      "What you do and what you want from us. We will research your market, competitors and search presence ourselves — that is our job, not a form.",
    fields: [
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
        id: "timing",
        label: "Anything happening soon we should know about?",
        type: "textarea",
        rows: 3,
        help: "A new practitioner starting, a location opening, a quiet season you want to fix before it arrives.",
      },
    ],
  },

  {
    id: "site",
    title: "Your website",
    blurb:
      "Where things stand today, and your taste. We will recommend the pages, structure and features — but nobody knows what you find beautiful except you.",
    fields: [
      {
        id: "existingSite",
        label: "Current website",
        type: "url",
        placeholder: "https://",
        help: "We will review it properly before we speak.",
      },
      {
        id: "incumbent",
        label: "Is anyone currently looking after your website or marketing?",
        type: "textarea",
        rows: 3,
        help: "An agency, a freelancer, a family member who built it years ago. Worth knowing early — handovers take longer than the work itself.",
      },
      {
        id: "sitesLiked",
        label: "Websites you like the look of",
        type: "textarea",
        rows: 4,
        help: "Two or three links, any industry at all. A line on what you like about each — the colours, the feel, how simple it is — helps far more than the link alone.",
      },
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
        help: "Real photos of your actual space beat stock photography every time — it is the fastest way to not look like everyone else.",
      },
      {
        id: "assetsLink",
        label: "Logo, photos and any existing content",
        type: "url",
        placeholder: "https://",
        help: "A Drive, Dropbox or WeTransfer link is easiest. If you are not sure how, leave this blank — we will send you a simple upload link instead.",
      },
      {
        id: "anythingElse",
        label: "Anything else we should know?",
        type: "textarea",
        rows: 4,
      },
    ],
  },

  {
    id: "access",
    title: "Access",
    blurb:
      "We now connect the accounts we will be working on. No passwords — you invite us in, and you can remove us at any time. Do not worry if you are unsure where something lives: pick “Not sure — help me” and we will sort it together.",
    fields: [
      {
        id: "adAccounts",
        label: "Do you run paid ads?",
        type: "radio",
        required: true,
        options: [HAS_ADS, WANTS_ADS_HELP, "No, and not planning to"],
        help: "Google, Facebook, Instagram or TikTok. If you would like ads but have no accounts, pick the middle option and we will set them up with you.",
      },
      {
        id: "onlinePayments",
        label: "Does your website take payments?",
        type: "radio",
        required: true,
        options: ["Yes", "No"],
        help: "Selling packages, vouchers or classes online, as opposed to taking payment in the clinic.",
      },
      {
        id: "newsletters",
        label: "Do you send newsletters or marketing emails?",
        type: "radio",
        required: true,
        options: ["Yes", "No"],
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
  },
];

/** Flagged in the brief so the ads setup work is not missed. */
export const ADS_HELP_ANSWER = WANTS_ADS_HELP;

/** Fields visible for the current answers, per step. */
export function visibleFields(step: Step, values: Values): Field[] {
  return step.fields.filter((f) => !f.showIf || f.showIf(values));
}

/** Access rows that apply to this client's answers. */
export function visibleAccessItems(values: Values): AccessItem[] {
  return ACCESS_ITEMS.filter((i) => !i.showIf || i.showIf(values));
}
