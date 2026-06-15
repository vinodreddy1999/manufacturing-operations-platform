import { LockKeyhole } from 'lucide-react';

type AccessDeniedStateProps = {
  title?: string;
  description?: string;
};

export function AccessDeniedState({
  title = 'Access restricted',
  description = 'Your role can sign in successfully, but this section is reserved for broader platform permissions.',
}: AccessDeniedStateProps) {
  return (
    <div className="rounded-[28px] border border-amber-200/70 bg-amber-50/90 p-6 shadow-panel">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-950">{title}</p>
          <p className="mt-1 text-sm leading-6 text-amber-800">{description}</p>
        </div>
      </div>
    </div>
  );
}
