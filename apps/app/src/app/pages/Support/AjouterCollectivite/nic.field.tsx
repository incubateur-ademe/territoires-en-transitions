import { Field, Input } from '@tet/ui';

type Props = {
  value: string | undefined;
  onChange: (value: string) => void;
};

export const NicField = ({ value, onChange }: Props) => {
  return (
    <Field title="NIC" hint="Le NIC est composé de 5 chiffres">
      <Input
        type="text"
        maxLength={5}
        value={value}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, '');
          onChange(value);
        }}
      />
    </Field>
  );
};
