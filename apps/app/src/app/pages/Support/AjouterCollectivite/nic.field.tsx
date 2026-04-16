import { appLabels } from '@/app/labels/catalog';
import { Field, Input } from '@tet/ui';

type Props = {
  value: string | undefined;
  onChange: (value: string) => void;
};

export const NicField = ({ value, onChange }: Props) => {
  return (
    <Field title={appLabels.formNic} hint={appLabels.formNicHint}>
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
