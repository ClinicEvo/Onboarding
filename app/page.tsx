import Image from "next/image";
import OnboardingForm from "@/components/onboarding-form";
import { lookupClient } from "@/lib/clients";

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/95">
      <div className="mx-auto flex w-full max-w-[75rem] items-center justify-between gap-6 px-6 py-4 md:px-10">
        <Image
          src="/brand/cevo_newlogo.png"
          alt="Clinic Evo"
          width={2526}
          height={440}
          priority
          className="h-6 w-auto md:h-7"
        />
        <p className="text-[0.8125rem] text-muted">
          Project onboarding
          <span className="hidden sm:inline"> — about fifteen minutes</span>
        </p>
      </div>
    </header>
  );
}

export default async function Page({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const raw = params.c;
  const code = Array.isArray(raw) ? raw[0] : raw;

  // undefined = gating off, null = bad or missing code, string = client name.
  const client = lookupClient(code);

  if (client === null) {
    return (
      <main className="relative z-10 min-h-[100dvh]">
        <Header />
        <div className="mx-auto w-full max-w-[640px] px-6 py-24 md:px-10 md:py-32">
          <h1 className="text-[clamp(2.5rem,5vw,3.75rem)] leading-[1.08] text-ink">
            Check your link
          </h1>
          <p className="mt-4 max-w-[62ch] text-lg text-muted">
            This form is opened with a personal link we send you, and the one
            you have used does not look right. It may have been cut short by an
            email client, which happens more often than you would think.
          </p>
          <p className="mt-4 max-w-[62ch] text-lg text-muted">
            Try copying the whole link out of the original email, or reply to it
            and we will send a fresh one.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-10 min-h-[100dvh]">
      <Header />
      <OnboardingForm clientCode={code ?? ""} clientName={client ?? ""} />
    </main>
  );
}
