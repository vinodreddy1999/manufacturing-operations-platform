import type { ReactNode } from 'react';

type ActionNoticeProps = {
  message: string;
  tone?: 'success' | 'error' | 'info';
  onDismiss?: () => void;
  children?: ReactNode;
};

const toneClasses = {
  success: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100',
  error: 'border-red-300/20 bg-red-400/10 text-red-100',
  info: 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100',
};

export function ActionNotice({ message, tone = 'info', onDismiss, children }: ActionNoticeProps) {
  if (!message && !children) return null;

  return (
    <div className={`mb-4 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${toneClasses[tone]}`} role="status" aria-live="polite">
      <div>{message || children}</div>
      {onDismiss ? (
        <button type="button" className="form-button-subtle shrink-0 py-1 text-xs" onClick={onDismiss}>
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
