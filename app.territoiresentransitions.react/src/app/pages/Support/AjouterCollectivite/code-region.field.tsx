import { Field, Input } from '@/ui';

type Props = {
  value: string | undefined;
  onChange: (value: string) => void;
};

export const CodeRegionField = ({value, onChange} : Props) => {
  return (
    <Field title="Code région" hint="Le code région est composé de 1 à 2 chiffres">
      <Input
        type="text"
        maxLength={2}
        value={value}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, '');
          onChange(value)
        }}
      />
    </Field>
  )
}
