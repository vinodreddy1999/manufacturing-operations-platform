import { Eye, EyeOff } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
};

/** A password input with a show/hide toggle, styled to match the caller's own input className. */
export function PasswordField({ value, onChange, className, ...rest }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        {...rest}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${className ?? ''} pr-11`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
