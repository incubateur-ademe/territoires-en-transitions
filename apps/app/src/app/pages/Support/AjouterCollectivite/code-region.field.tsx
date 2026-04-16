import { appLabels } from '@/app/labels/catalog';
import { Field, Input } from '@tet/ui';

type Props = {
  value: string | undefined;
  onChange: (value: string) => void;
};

export const CodeRegionField = ({ value, onChange }: Props) => {
  return (
    <Field title={appLabels.formCodeRegion} hint={appLabels.formCodeRegionHint}>
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
