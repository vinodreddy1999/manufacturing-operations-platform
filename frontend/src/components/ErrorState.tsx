import { AlertTriangle } from 'lucide-react';

import { getErrorMessage } from '../lib/errors';

type ErrorStateProps = {
  error: unknown;
  title?: string;
};

export function ErrorState({ error, title = 'Unable to load data' }: ErrorStateProps) {
  return (
    <div className="enterprise-card border-red-300/20 bg-red-400/10 p-token-5 text-body-sm text-red-100">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
        <div>
          <p className="font-semibold text-red-50">{title}</p>
          <p className="mt-1 text-red-100/80">{getErrorMessage(error)}</p>
        </div>
      </div>
    </div>
  );
}
