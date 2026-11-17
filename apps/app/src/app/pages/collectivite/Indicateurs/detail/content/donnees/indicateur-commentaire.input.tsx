import { Field, Textarea } from '@tet/ui';
import { useState } from 'react';

type Props = {
  commentaire: string | undefined | null;
  disabled?: boolean;
  updateCommentaire: (value: string) => void;
};

export const IndicateurCommentaireInput = ({
  commentaire,
  disabled,
  updateCommentaire: updateDescription,
}: Props) => {
  const [value, setValue] = useState(commentaire ?? undefined);

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
