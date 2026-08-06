import Image from "next/image";
import OnboardingForm from "@/components/onboarding-form";

export default function Page() {
  return (
    <main className="relative z-10 min-h-[100dvh]">
      {/* DS: sticky header, white, hairline rule beneath. */}
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur-none">
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

      <OnboardingForm />
    </main>
  );
}
