import OnboardingForm from "@/components/onboarding-form";
import { CheckYourLink, Header } from "@/components/page-shell";
import { lookupClient } from "@/lib/clients";

/*
  Stage 2, sent after the kickoff call rather than on day one.

  Deliberately a separate page. Putting it alongside the onboarding questions
  meant a clinic owner was confronted with fourteen accounts to audit in the
  same breath as being asked their opening hours — which reads as homework
  handed over at the exact moment they expected work to be taken off them.
*/

const LABEL = "Connecting your accounts";

export default async function AccessPage({ searchParams }: PageProps<"/access">) {
  const params = await searchParams;
  const raw = params.c;
  const code = Array.isArray(raw) ? raw[0] : raw;

  const client = lookupClient(code);

  if (client === null) return <CheckYourLink label={LABEL} />;

  return (
    <main className="relative z-10 min-h-[100dvh]">
      <Header label={LABEL} />
      <OnboardingForm
        formKind="access"
        clientCode={code ?? ""}
        clientName={client ?? ""}
      />
    </main>
  );
}
