import { Field, Input } from '@tet/ui';

type Props = {
  value: string | undefined;
  onChange: (value: string) => void;
};

export const CodeCommuneField = ({ value, onChange }: Props) => {
  return (
    <Field
      title="Code commune"
      hint="Le code attendu est le code commune INSEE et non le code postal"
    >
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
