type LabeledTextInputProps = {
  label: string;
  maxLength?: number;
  onChange: (value: string) => void;
};

export const LabeledTextInput = ({
  label,
  maxLength,
  onChange,
}: LabeledTextInputProps) => (
  <fieldset>
    <label className="fr-label">
      {label}
      <slot />
    </label>

    <input
      className="fr-input"
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      // on:keyup={() => (errorMessage = validator(value))}
    />
  </fieldset>
);
