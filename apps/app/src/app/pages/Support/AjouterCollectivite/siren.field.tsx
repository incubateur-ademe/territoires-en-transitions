import { appLabels } from '@/app/labels/catalog';
import { Field, Input } from '@tet/ui';

type Props = {
  value: string | undefined;
  onChange: (value: string) => void;
};

export const SirenField = ({ value, onChange }: Props) => {
  return (
    <Field title={appLabels.formSiren} hint={appLabels.formSirenHint}>
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
