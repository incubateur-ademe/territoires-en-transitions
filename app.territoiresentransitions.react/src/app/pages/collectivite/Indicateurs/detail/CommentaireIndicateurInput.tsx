import { Field, Textarea } from '@/ui';
import { useEffect, useState } from 'react';

type Props = {
  description: string | undefined | null;
  disabled?: boolean;
  updateDescription: (value: string) => void;
};

export const CommentaireIndicateurInput = ({
  description,
  disabled,
  updateDescription,
}: Props) => {
  const [value, setValue] = useState(description ?? undefined);

  useEffect(() => setValue(description ?? undefined), [description]);

  return (
    <Field title="Description et méthodologie de calcul">
      <Textarea
        data-test="desc"
        rows={3}
        value={value}
        onChange={(evt) => setValue(evt.currentTarget.value)}
        disabled={disabled}
        onBlur={(evt) => updateDescription(evt.currentTarget.value)}
      />
    </Field>
  );
};
