"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import { ShieldCheckIcon } from "@phosphor-icons/react/dist/csr/ShieldCheck";
import { WarningIcon } from "@phosphor-icons/react/dist/csr/Warning";

import {
  STEPS,
  visibleFields,
  visibleAccessItems,
  type Field,
  type Values,
} from "@/lib/schema";
import { AccessGrid, CheckboxGroup, RadioGroup, TextField } from "./fields";

const DRAFT_KEY = "onboarding-draft-v1";

/* Canonical "have we hydrated yet" check: false on the server, true on the
   client, with nothing to subscribe to. */
const noopSubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
/* DS motion: understated and physical, not bouncy. */
const SPRING = { type: "spring", stiffness: 68, damping: 18 } as const;

/**
 * The brand's one interaction icon. The DS is explicit that this exact path
 * should be reused rather than substituting a font-icon arrow.
 */
function ArrowGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 7h8M7 3l4 4-4 4" />
    </svg>
  );
}

type Grants = Record<string, string>;
type Status = "idle" | "submitting" | "error" | "done";

function validate(fields: Field[], values: Values): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const raw = values[field.id];
    const empty = Array.isArray(raw) ? raw.length === 0 : !raw?.trim();

    if (field.required && empty) {
      errors[field.id] = "This one we do need.";
      continue;
    }
    if (empty) continue;

    const text = String(raw).trim();
    if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      errors[field.id] = "That does not look like an email address.";
    }
    if (field.type === "url" && !/^https?:\/\/.+\..+/.test(text)) {
      errors[field.id] = "Please include the full address, starting with https://";
    }
  }

  return errors;
}

interface Draft {
  values: Values;
  grants: Grants;
  stepIndex: number;
}

/**
 * Reads a saved draft so a half-finished form survives a closed tab.
 *
 * Returns null on the server, so the first client render matches the server
 * render. The restored values only reach the DOM once `hydrated` flips, which
 * is why there is no hydration mismatch despite the state differing.
 */
function readDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return {
      values: parsed.values ?? {},
      grants: parsed.grants ?? {},
      stepIndex: Math.min(parsed.stepIndex ?? 0, STEPS.length - 1),
    };
  } catch {
    /* Corrupt draft is not worth surfacing — start clean. */
    return null;
  }
}

interface Props {
  /** Per-client code from the URL. Empty when gating is off. */
  clientCode: string;
  /** Client name resolved from that code. Empty when gating is off. */
  clientName: string;
}

export default function OnboardingForm({ clientCode, clientName }: Props) {
  const [draft] = useState(readDraft);
  const [stepIndex, setStepIndex] = useState(draft?.stepIndex ?? 0);
  // Prefill the business name when we already know who this is — one less
  // thing to type, and it shows the client the link was meant for them.
  const [values, setValues] = useState<Values>(
    draft?.values ?? (clientName ? { businessName: clientName } : {}),
  );
  const [grants, setGrants] = useState<Grants>(draft?.grants ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [failure, setFailure] = useState<string>("");

  const hydrated = useSyncExternalStore(
    noopSubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const restored = Object.keys(draft?.values ?? {}).length > 0;

  const headingRef = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useReducedMotion();

  const step = STEPS[stepIndex];
  const fields = useMemo(() => visibleFields(step, values), [step, values]);
  const accessItems = useMemo(() => visibleAccessItems(values), [values]);
  const isLast = stepIndex === STEPS.length - 1;

  useEffect(() => {
    if (!hydrated || status === "done") return;
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ values, grants, stepIndex }),
    );
  }, [values, grants, stepIndex, hydrated, status]);

  const setValue = useCallback((id: string, value: string | string[]) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const focusHeading = () =>
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });

  const goBack = () => {
    setErrors({});
    setStepIndex((i) => Math.max(0, i - 1));
    focusHeading();
  };

  const goNext = async () => {
    const found = validate(fields, values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      const first = document.getElementById(Object.keys(found)[0]);
      first?.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
      first?.focus({ preventScroll: true });
      return;
    }

    if (!isLast) {
      setStepIndex((i) => i + 1);
      focusHeading();
      return;
    }

    setStatus("submitting");
    setFailure("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values,
          accessGrants: grants,
          clientCode,
          submittedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server responded ${res.status}`);
      }
      localStorage.removeItem(DRAFT_KEY);
      setStatus("done");
      focusHeading();
    } catch (err) {
      setStatus("error");
      setFailure(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  /* Loading skeleton matching the real layout, not a spinner. */
  if (!hydrated) {
    return (
      <div className="mx-auto grid w-full max-w-[75rem] gap-10 px-6 py-16 md:grid-cols-[240px_minmax(0,1fr)] md:gap-16 md:px-10 md:py-24">
        <div className="hidden flex-col gap-3 md:flex">
          {STEPS.map((s) => (
            <div key={s.id} className="h-4 w-32 animate-pulse rounded-sm bg-line" />
          ))}
        </div>
        <div className="flex flex-col gap-6">
          <div className="h-10 w-2/3 animate-pulse rounded-sm bg-line" />
          <div className="h-4 w-full max-w-md animate-pulse rounded-sm bg-line" />
          <div className="mt-4 flex flex-col gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="h-4 w-40 animate-pulse rounded-sm bg-line" />
                <div className="h-10 w-full animate-pulse rounded-sm bg-line" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="mx-auto w-full max-w-[640px] px-6 py-24 md:px-10 md:py-32"
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-light">
          <CheckIcon size={20} weight="bold" className="text-accent" />
        </span>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-6 text-[clamp(2.5rem,5vw,3.75rem)] leading-[1.08] text-ink"
        >
          That is everything.
        </h1>
        <p className="mt-4 max-w-[62ch] text-lg text-muted">
          Your answers are saved and we have been notified. We will read through
          properly and come back within two working days, usually with a handful
          of follow-up questions.
        </p>
        <div className="mt-8 border-l-2 border-accent pl-4">
          <p className="font-display text-[0.9375rem] font-semibold text-ink">
            While you wait
          </p>
          <p className="mt-1 max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted">
            If you left any access items as{" "}
            <span className="text-ink">Will do</span>, working through those now
            is the single most useful thing you can do. Access is the usual
            reason a build sits waiting.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-[75rem] gap-10 px-6 py-16 md:grid-cols-[240px_minmax(0,1fr)] md:gap-16 md:px-10 md:py-24">
      {/* Progress rail — sticky on desktop, compact bar on mobile. */}
      <aside className="md:sticky md:top-24 md:self-start">
        <p className="eyebrow">
          Step {stepIndex + 1} of {STEPS.length}
        </p>

        <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-line md:hidden">
          <motion.div
            className="h-full origin-left bg-accent"
            initial={false}
            animate={{ scaleX: (stepIndex + 1) / STEPS.length }}
            transition={SPRING}
            style={{ width: "100%" }}
          />
        </div>

        {/* No step title here — the h1 below already says it on mobile. */}

        <ol className="mt-5 hidden flex-col gap-0.5 md:flex">
          {STEPS.map((s, i) => {
            const done = i < stepIndex;
            const current = i === stepIndex;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={i > stepIndex}
                  onClick={() => {
                    setErrors({});
                    setStepIndex(i);
                    focusHeading();
                  }}
                  className={`group flex w-full items-center gap-2.5 rounded-[4px] py-1.5 text-left text-[0.875rem] leading-snug transition-colors disabled:cursor-not-allowed ${
                    current
                      ? "font-medium text-ink"
                      : done
                        ? "text-muted hover:text-accent"
                        : // Upcoming steps are de-emphasised but must stay
                          // legible — the hairline colour is invisible on white.
                          "text-muted/70"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors ${
                      done
                        ? "border-accent bg-accent"
                        : current
                          ? "border-accent"
                          : "border-line"
                    }`}
                  >
                    {done ? (
                      <CheckIcon size={9} weight="bold" className="text-paper" />
                    ) : (
                      <span
                        className={`h-1.5 w-1.5 rounded-full bg-accent transition-transform duration-200 ${
                          current ? "scale-100" : "scale-0"
                        }`}
                      />
                    )}
                  </span>
                  <span className="truncate">{s.title}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {restored && stepIndex > 0 && (
          <p className="mt-6 hidden max-w-[200px] text-[0.75rem] leading-relaxed text-muted md:block">
            We picked up where you left off. Your answers save automatically.
          </p>
        )}
      </aside>

      {/* Form column */}
      <div className="min-w-0">
        {/*
          Keyed on step id so React swaps the subtree and the new step animates
          in. Deliberately no AnimatePresence: an exit animation here buys
          nothing visually and its exit bookkeeping can strand the outgoing
          step on screen.
        */}
        {/*
          Transform only, no opacity. If the tab is backgrounded mid-animation
          the rAF loop pauses; a frozen translate is a harmless 14px offset,
          whereas a frozen fade would leave the step unreadable.
        */}
        <motion.section
          key={step.id}
          initial={reduceMotion ? false : { y: 14 }}
          animate={{ y: 0 }}
          transition={SPRING}
        >
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-[clamp(2.5rem,5vw,3.75rem)] leading-[1.08] text-ink"
            >
              {step.title}
            </h1>
            <p className="mt-4 max-w-[62ch] text-lg text-muted">
              {step.blurb}
            </p>

            {step.id === "access" && (
              <div className="mt-8 flex gap-3 rounded-[14px] border border-line bg-accent-light p-5">
                <ShieldCheckIcon
                  size={20}
                  weight="regular"
                  className="mt-1 shrink-0 text-accent"
                />
                <div className="max-w-[58ch] text-[0.875rem] text-ink">
                  <p className="font-display font-semibold">
                    Never send us login details for anything holding client or
                    patient records.
                  </p>
                  <p className="mt-1 text-muted">
                    That includes practice management and health record systems.
                    We do not need them to build your website, and you should not
                    be sharing them with anyone.
                  </p>
                </div>
              </div>
            )}

            <form
              className="mt-10 flex flex-col gap-7"
              onSubmit={(e) => {
                e.preventDefault();
                void goNext();
              }}
              noValidate
            >
              {fields.map((field) => {
                if (field.type === "access") {
                  return (
                    <AccessGrid
                      key={field.id}
                      items={accessItems}
                      value={grants}
                      onChange={setGrants}
                    />
                  );
                }

                const shared = {
                  field,
                  value: values[field.id] ?? (field.type === "checkbox" ? [] : ""),
                  error: errors[field.id],
                  onChange: (v: string | string[]) => setValue(field.id, v),
                };

                if (field.type === "radio") return <RadioGroup key={field.id} {...shared} />;
                if (field.type === "checkbox") return <CheckboxGroup key={field.id} {...shared} />;
                return <TextField key={field.id} {...shared} />;
              })}

              {status === "error" && (
                <div
                  role="alert"
                  className="flex gap-3 rounded-[14px] border border-error/25 bg-error/5 p-5"
                >
                  <WarningIcon size={18} className="mt-1 shrink-0 text-error" />
                  <div className="text-[0.875rem]">
                    <p className="font-display font-semibold text-error">
                      We could not send that.
                    </p>
                    <p className="mt-1 text-muted">
                      {failure} Your answers are still saved on this device, so
                      nothing is lost — try again, and if it keeps failing, email
                      us and we will sort it out.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-2 flex items-center gap-3 border-t border-line pt-6">
                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="group flex items-center gap-1.5 rounded-[4px] px-3 py-2 text-[0.875rem] text-muted transition-colors duration-200 hover:text-accent active:scale-[0.99]"
                  >
                    <ArrowLeftIcon
                      size={14}
                      className="transition-transform duration-200 group-hover:-translate-x-0.5"
                    />
                    Back
                  </button>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="group ml-auto flex items-center gap-2 rounded-[4px] bg-accent px-7 py-3 text-[0.875rem] font-semibold tracking-[0.02em] text-paper transition-[background-color,transform] duration-200 hover:bg-accent-dim active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "submitting"
                    ? "Sending"
                    : isLast
                      ? "Send it over"
                      : "Continue"}
                  {status !== "submitting" && (
                    <ArrowGlyph className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  )}
                </button>
              </div>

              <p className="text-[0.75rem] text-muted">
                Your answers save to this browser as you go, so you can close the
                tab and come back.
              </p>
            </form>
        </motion.section>
      </div>
    </div>
  );
}
