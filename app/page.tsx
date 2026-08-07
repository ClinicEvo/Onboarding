import OnboardingForm from "@/components/onboarding-form";
import { CheckYourLink, Header } from "@/components/page-shell";
import { lookupClient } from "@/lib/clients";

const LABEL = "Project onboarding";
const ASIDE = "about ten minutes";

export default async function Page({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const raw = params.c;
  const code = Array.isArray(raw) ? raw[0] : raw;

  // undefined = gating off, null = bad or missing code, string = client name.
  const client = lookupClient(code);

  if (client === null) return <CheckYourLink label={LABEL} />;

  return (
    <main className="relative z-10 min-h-[100dvh]">
      <Header label={LABEL} aside={ASIDE} />
      <OnboardingForm
        clientCode={code ?? ""}
        clientName={client ?? ""}
      />
    </main>
  );
}
