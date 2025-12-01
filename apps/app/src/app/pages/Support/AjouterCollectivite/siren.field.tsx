import { Field, Input } from '@tet/ui';

type Props = {
  value: string | undefined;
  onChange: (value: string) => void;
};

export const SirenField = ({ value, onChange }: Props) => {
  return (
    <Field title="Siren" hint="Le siren est composé de 9 chiffres">
      <Input
        type="text"
        maxLength={9}
        value={value}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, '');
          onChange(value);
        }}
      />
    </Field>
  );
};
