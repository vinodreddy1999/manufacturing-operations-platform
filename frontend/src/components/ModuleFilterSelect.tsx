type ModuleFilterSelectProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

export function ModuleFilterSelect({ label, options, value, onChange }: ModuleFilterSelectProps) {
  return (
    <label className="text-sm text-slate-300">
      {label}
      <select className="form-input mt-1 w-full" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All {label.toLowerCase()}</option>
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
