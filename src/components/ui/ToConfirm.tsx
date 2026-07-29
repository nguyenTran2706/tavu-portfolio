import { AlertTriangle } from 'lucide-react';
import { isToConfirm } from '@/content/profile';

/**
 * Renders a visible, deliberately unmissable marker for anything the source PDF
 * didn't contain. The brief asked for placeholders to be obvious rather than
 * silently absent — an empty space reads as "finished", a badge reads as "todo".
 */
export function ToConfirm({ label }: { label: string }) {
  return (
    <span className="to-confirm" title={`Not found in the source résumé: ${label}`}>
      <AlertTriangle aria-hidden="true" className="h-3 w-3 shrink-0" />
      {label} — to confirm
    </span>
  );
}

/** Renders `children(value)` when the field is real, or the badge when it isn't. */
export function Field<T>({
  value,
  children,
}: {
  value: T | { __toConfirm: string };
  children: (v: T) => React.ReactNode;
}) {
  if (isToConfirm(value)) return <ToConfirm label={value.__toConfirm} />;
  return <>{children(value as T)}</>;
}
