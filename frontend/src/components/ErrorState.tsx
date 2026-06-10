import { AlertTriangle } from 'lucide-react';

import { getErrorMessage } from '../lib/errors';

type ErrorStateProps = {
  error: unknown;
  title?: string;
};

export function ErrorState({ error, title = 'Unable to load data' }: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1">{getErrorMessage(error)}</p>
        </div>
      </div>
    </div>
  );
}
