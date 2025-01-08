import { AutoResizedTextarea, Field } from '@/ui';

type Props = {
  description: string | undefined | null;
  disabled?: boolean;
  updateDescription: (value: string) => void;
};

const DescriptionIndicateurInput = ({
  description,
  disabled,
  updateDescription,
}: Props) => {
  return (
    <Field title="Description et méthodologie de calcul">
      <AutoResizedTextarea
        data-test="desc"
        value={description ?? undefined}
        disabled={disabled}
        onBlur={(evt) => updateDescription(evt.currentTarget.value)}
      />
    </Field>
  );
};

export default DescriptionIndicateurInput;
