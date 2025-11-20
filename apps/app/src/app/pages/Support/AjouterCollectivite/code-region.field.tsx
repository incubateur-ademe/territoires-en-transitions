import { Field, Input } from '@tet/ui';

type Props = {
  value: string | undefined;
  onChange: (value: string) => void;
};

export const CodeRegionField = ({ value, onChange }: Props) => {
  return (
    <Field
      title="Code région"
      hint="Le code région est composé de 2 chiffres (01 à 99)"
    >
      <Input
        type="text"
        maxLength={2}
        value={value}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, '');
          onChange(value);
        }}
      />
    </Field>
  );
};
