import { ChangeEvent, useState } from "react";

export type SelectInputProps = {
  label: string;
  values: { key: string; label: string }[];
  onChange?: (valueId: string) => void;
};
export const SelectInput = ({ label, values, onChange }: SelectInputProps) => {
  const [value, setValue] = useState("");
  const handleChange = (e: ChangeEvent) => {
    const selectedValueId = e.target.id;
    setValue(selectedValueId);
    if (onChange) onChange(selectedValueId);
  };
  return (
    <div>
      <label className="fr-label">{label}</label>
      <select value={value} className="fr-select" onChange={handleChange}>
        {values.map((value) => (
          <option value={value.key} key={value.key}>
            {value.label}
          </option>
        ))}
      </select>
    </div>
  );
};
