import { useEffect, useRef } from "react";

type AutofillField = {
  name: string;
  value: string;
  setValue: (next: string) => void;
};

/** Sync browser autofill into React state (controlled inputs often miss it). */
export function useBrowserAutofillSync(enabled: boolean, fields: AutofillField[]) {
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  useEffect(() => {
    if (!enabled) return;

    const sync = () => {
      for (const field of fieldsRef.current) {
        const el = document.querySelector<HTMLInputElement>(`input[name="${field.name}"]`);
        if (el?.value && el.value !== field.value) {
          field.setValue(el.value);
        }
      }
    };

    sync();
    const timers = [50, 200, 500, 1000].map((ms) => window.setTimeout(sync, ms));
    window.addEventListener("focus", sync, true);
    document.addEventListener("visibilitychange", sync);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("focus", sync, true);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [enabled]);
}
