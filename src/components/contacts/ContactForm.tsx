"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import Field from "@/components/ui/Field";
import Button, { buttonClasses } from "@/components/ui/Button";
import { CONTACT_FIELD_GROUPS } from "@/lib/contacts/schema";
import {
  EMPTY_FORM_STATE,
  type Contact,
  type ContactInput,
  type FormState,
} from "@/lib/contacts/types";

export type ContactFormAction = (
  state: FormState,
  formData: FormData,
) => Promise<FormState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {pending ? "Saving…" : label}
    </Button>
  );
}

function PhotoField({ initialPhoto, error }: { initialPhoto: string; error?: string }) {
  const [photo, setPhoto] = useState(initialPhoto);
  const [clientError, setClientError] = useState<string>();

  function choosePhoto(file?: File) {
    if (!file) return;
    if (!/image\/(png|jpeg|webp|gif)/.test(file.type)) {
      setClientError("Choose a PNG, JPEG, WebP, or GIF image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setClientError("Photo must be 2 MB or smaller");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(String(reader.result));
      setClientError(undefined);
    };
    reader.readAsDataURL(file);
  }

  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">Photo</legend>
      <div className="border-b border-hairline pb-2">
        <h2 className="font-display text-sm font-semibold text-foreground">Photo</h2>
        <p className="text-[13px] text-muted-foreground">PNG, JPEG, WebP, or GIF up to 2 MB.</p>
      </div>
      <input type="hidden" name="photo" value={photo} />
      <div className="flex items-center gap-4">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="Contact preview" className="h-20 w-20 rounded-full border border-border object-cover" />
        ) : (
          <div className="h-20 w-20 rounded-full border border-dashed border-border bg-muted" aria-hidden="true" />
        )}
        <div className="space-y-2">
          <input
            aria-label="Contact photo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => choosePhoto(event.target.files?.[0])}
            className="block text-sm text-muted-foreground"
          />
          {photo ? <Button type="button" variant="secondary" onClick={() => setPhoto("")}>Remove photo</Button> : null}
          {clientError || error ? <p role="alert" className="text-sm text-destructive">{clientError ?? error}</p> : null}
        </div>
      </div>
    </fieldset>
  );
}

/**
 * Create/edit form. The field list comes from `CONTACT_FIELD_GROUPS`, and the
 * action is a bound server action — so a submit is a plain POST that works
 * before hydration and reports errors through `useActionState`.
 */
export default function ContactForm({
  action,
  contact,
  submitLabel,
  cancelHref,
}: {
  action: ContactFormAction;
  contact?: Contact;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  function valueFor(name: keyof ContactInput): string {
    return state.values?.[name] ?? contact?.[name] ?? "";
  }

  return (
    <form action={formAction} noValidate className="space-y-8">
      {state.status === "error" && state.message ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-foreground"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
            strokeWidth={2}
            aria-hidden="true"
          />
          <span>{state.message}</span>
        </div>
      ) : null}

      {CONTACT_FIELD_GROUPS.map((group) => (
        <fieldset key={group.title} className="space-y-4">
          <legend className="sr-only">{group.title}</legend>

          <div className="border-b border-hairline pb-2">
            <h2 className="font-display text-sm font-semibold text-foreground">
              {group.title}
            </h2>
            <p className="text-[13px] text-muted-foreground">
              {group.description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <Field
                key={field.name}
                field={field}
                defaultValue={valueFor(field.name)}
                error={state.fieldErrors?.[field.name]}
              />
            ))}
          </div>
        </fieldset>
      ))}

      <PhotoField
        initialPhoto={state.values?.photo ?? contact?.photo ?? ""}
        error={state.fieldErrors?.photo}
      />

      <div className="flex items-center gap-2 border-t border-hairline pt-4">
        <SubmitButton label={submitLabel} />
        <Link href={cancelHref} className={buttonClasses("secondary")}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
