import { Field, Input } from '@/ui';

type Props = {
  value: string | undefined;
  onChange: (value: string) => void;
};

export const CodeDepartementField = ({value, onChange} : Props) => {
  return (
    <Field title="Code département" hint="Le code département est composé de 2 à 3 chiffres (01 à 999)">
      <Input
        type="text"
        maxLength={3}
        value={value}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9ab]/gi, '')
          onChange(value)
        }}
      />
    </Field>
  );
}
