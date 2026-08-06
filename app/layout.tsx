import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

/*
  Real Clinic Evo brand fonts, copied from the design system package —
  not Google Fonts substitutes. DM Sans for body/UI, Plus Jakarta Sans
  SemiBold for display. Brume is deliberately not included: the DS reserves it
  for the wordmark, the wordmark here is the logo image, and it is the one face
  in the set whose licence is not clearly redistributable.
*/

const dmSans = localFont({
  variable: "--font-dm-sans",
  display: "swap",
  src: [
    { path: "./fonts/DMSans_24pt-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/DMSans_24pt-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/DMSans_18pt-Medium.woff2", weight: "500", style: "normal" },
  ],
});

const jakarta = localFont({
  variable: "--font-jakarta",
  display: "swap",
  src: [
    { path: "./fonts/PlusJakartaSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/PlusJakartaSans-SemiBold.woff2", weight: "600", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Clinic Evo — project onboarding",
  description: "Everything we need to start building your site.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${dmSans.variable} ${jakarta.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
