"use client";

import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import type { Field } from "@/lib/schema";
import { ACCESS_STATUSES, type AccessItem } from "@/lib/schema";

/* Shared chrome: label above, helper text under the label, error under the control. */

function Label({ field }: { field: Field }) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={field.id}
        className="font-display text-[0.9375rem] leading-snug font-semibold text-ink"
      >
        {field.label}
        {field.required && (
          <span className="ml-1 text-accent" aria-hidden="true">
            *
          </span>
        )}
        {field.required && <span className="sr-only"> (required)</span>}
      </label>
      {field.help && (
        <p className="max-w-[62ch] text-[0.8125rem] leading-relaxed text-muted">
          {field.help}
        </p>
      )}
    </div>
  );
}

function ErrorText({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} role="alert" className="text-[0.8125rem] text-error">
      {error}
    </p>
  );
}

export interface FieldProps {
  field: Field;
  value: string | string[];
  error?: string;
  onChange: (value: string | string[]) => void;
}

export function TextField({ field, value, error, onChange }: FieldProps) {
  const isArea = field.type === "textarea";
  const describedBy = error ? `${field.id}-error` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <Label field={field} />
      {isArea ? (
        <textarea
          id={field.id}
          name={field.id}
          rows={field.rows ?? 4}
          value={value as string}
          placeholder={field.placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          className="field-input resize-y"
        />
      ) : (
        <input
          id={field.id}
          name={field.id}
          type={field.type}
          value={value as string}
          placeholder={field.placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          className="field-input"
        />
      )}
      <ErrorText id={field.id} error={error} />
    </div>
  );
}

export function RadioGroup({ field, value, error, onChange }: FieldProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">{field.label}</legend>
      <Label field={field} />
      <div
        role="radiogroup"
        aria-invalid={Boolean(error)}
        className="mt-1 flex flex-col gap-1.5"
      >
        {field.options?.map((option) => {
          const selected = value === option;
          return (
            <label
              key={option}
              className={`flex cursor-pointer items-start gap-3 rounded-[6px] border px-4 py-3 leading-snug transition-[background-color,border-color,transform] duration-200 active:scale-[0.99] ${
                selected
                  ? "border-accent bg-accent-light"
                  : "border-line bg-paper hover:border-muted"
              }`}
            >
              <input
                type="radio"
                name={field.id}
                value={option}
                checked={selected}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`mt-[5px] grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors ${
                  selected ? "border-accent" : "border-line"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full bg-accent transition-transform duration-200 ${
                    selected ? "scale-100" : "scale-0"
                  }`}
                />
              </span>
              <span className="text-[0.9375rem] text-ink">{option}</span>
            </label>
          );
        })}
      </div>
      <ErrorText id={field.id} error={error} />
    </fieldset>
  );
}

export function CheckboxGroup({ field, value, error, onChange }: FieldProps) {
  const selected = Array.isArray(value) ? value : [];

  const toggle = (option: string) =>
    onChange(
      selected.includes(option)
        ? selected.filter((o) => o !== option)
        : [...selected, option],
    );

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">{field.label}</legend>
      <Label field={field} />
      <div className="mt-1 flex flex-wrap gap-1.5">
        {field.options?.map((option) => {
          const on = selected.includes(option);
          return (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-2 rounded-[4px] border px-3 py-1.5 text-[0.875rem] leading-none transition-[background-color,border-color,transform] duration-200 active:scale-[0.99] ${
                on
                  ? "border-accent bg-accent-light text-ink"
                  : "border-line bg-paper text-muted hover:border-muted hover:text-ink"
              }`}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(option)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[2px] border transition-colors ${
                  on ? "border-accent bg-accent" : "border-line"
                }`}
              >
                <CheckIcon
                  size={10}
                  weight="bold"
                  className={`text-paper transition-transform duration-200 ${
                    on ? "scale-100" : "scale-0"
                  }`}
                />
              </span>
              {option}
            </label>
          );
        })}
      </div>
      <ErrorText id={field.id} error={error} />
    </fieldset>
  );
}

/**
 * The access checklist. Deliberately has no password input — the client
 * records what they have granted, not what their credentials are.
 */
export function AccessGrid({
  items,
  value,
  onChange,
}: {
  items: AccessItem[];
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-display text-[0.9375rem] font-semibold text-ink">
        Access checklist
      </p>
      <p className="max-w-[62ch] text-[0.8125rem] leading-relaxed text-muted">
        Work down the list. Mark each one once you have sent the invite — you do
        not need to finish them all before submitting this form.
      </p>

      <div className="card-surface mt-2 divide-y divide-line overflow-hidden">
        {items.map((item) => {
          const current = value[item.id] ?? "";
          return (
            <div
              key={item.id}
              className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start"
            >
              <div className="flex flex-col gap-1">
                <p className="font-display text-[0.875rem] font-semibold text-ink">
                  {item.label}
                </p>
                <p className="max-w-[58ch] text-[0.8125rem] leading-relaxed text-muted">
                  {item.how}
                </p>
                {/* Every row names its own addresses — different rows go to
                    different people, and a client should never have to
                    remember which. Where there are two, both are needed, so
                    say "both" rather than listing them and hoping. */}
                <p className="mt-1 max-w-[58ch] text-[0.8125rem] leading-relaxed text-ink">
                  Invite {item.grantTo.length > 1 && "both "}
                  {item.grantTo.map((address, i) => (
                    <span key={address}>
                      {i > 0 && " and "}
                      <span className="font-semibold text-accent">
                        {address}
                      </span>
                    </span>
                  ))}
                </p>
              </div>

              <div
                role="radiogroup"
                aria-label={`${item.label} status`}
                className="flex flex-wrap gap-1"
              >
                {ACCESS_STATUSES.map((status) => {
                  const on = current === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() =>
                        onChange({ ...value, [item.id]: on ? "" : status })
                      }
                      // 44px tall on touch: these are the main thing a client
                      // taps on the longest screen, and a 30px pill is a miss
                      // waiting to happen. Back to pill height on pointer.
                      className={`min-h-[44px] rounded-[4px] border px-3 text-[0.8125rem] leading-relaxed whitespace-nowrap transition-[background-color,border-color,transform] duration-200 active:scale-[0.99] md:min-h-0 md:px-2.5 md:py-1 md:text-[0.75rem] ${
                        on
                          ? "border-accent bg-accent text-paper"
                          : "border-line text-muted hover:border-muted hover:text-ink"
                      }`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
