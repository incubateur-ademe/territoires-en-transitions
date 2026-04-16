import { appLabels } from '@/app/labels/catalog';
import { Field, Input } from '@tet/ui';

type Props = {
  value: string | undefined;
  onChange: (value: string) => void;
};

export const CodeDepartementField = ({ value, onChange }: Props) => {
  return (
    <Field
      title={appLabels.formCodeDepartement}
      hint={appLabels.formCodeDepartementHint}
    >
      <Input
        type="text"
        maxLength={3}
        value={value}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9ab]/gi, '');
          onChange(value);
        }}
      />
    </Field>
  );
};
