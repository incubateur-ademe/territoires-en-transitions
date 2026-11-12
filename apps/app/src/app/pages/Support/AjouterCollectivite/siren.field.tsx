import { appLabels } from '@/app/labels/catalog';
import { Field, Input } from '@tet/ui';

type Props = {
  value: string | undefined;
  onChange: (value: string) => void;
  /** Erreur de saisie affichée sous le champ */
  error?: string;
};

export const SirenField = ({ value, onChange, error }: Props) => {
  return (
    <Field
      title={appLabels.formSiren}
      hint={appLabels.formSirenHint}
      state={error ? 'error' : 'default'}
      message={error}
    >
      <Input
        type="text"
        aria-invalid={error ? true : undefined}
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
