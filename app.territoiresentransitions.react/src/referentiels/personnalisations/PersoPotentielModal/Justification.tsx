import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { Accordion } from '@/app/ui/Accordion';
import Textarea from '@/app/ui/shared/form/Textarea';
import { useEffect, useState } from 'react';
import { TQuestionReponseProps } from './PersoPotentielQR';
import { useUpdateJustification } from './useUpdateJustification';

/**
 * Affiche le champ d'édtion de la justification d'une réponse
 * (ou un bouton pour affiche ce champ)
 */
export const Justification = (props: TQuestionReponseProps) => {
  const { qr } = props;
  const { reponse, justification, id } = qr;
  const collectivite = useCurrentCollectivite();
  const [value, setValue] = useState(justification);
  const { mutate: updateJustification } = useUpdateJustification();

  // synchronise la valeur initiale car la réponse est chargée de manière asynchrone
  useEffect(() => {
    setValue(justification);
  }, [justification]);

  if (!collectivite || reponse === undefined || reponse === null) {
    return null;
  }

  const hasValue = Boolean(value);

  return (
    <Accordion
      id={`j-${id}`}
      className="fr-mt-2w"
      titre="Justifier votre réponse (optionnel)"
      icon="fr-icon-draft-line"
      initialState={hasValue}
      html={
        <Textarea
          className="fr-input"
          value={value || ''}
          placeholder="Exemple : Cette compétence est transférée à Nom de la Collectivité par délibération du JJ-MM-AAAA OU Cette compétence est exercée par la collectivité sur 2/3 des communes soit 3/4 de la population"
          onInputChange={() => null}
          onChange={(evt) => setValue(evt.currentTarget.value)}
          onBlur={() => {
            const newValue = value?.trim() || '';
            if (newValue !== (justification || ''))
              updateJustification({
                collectivite_id: collectivite.collectiviteId,
                question_id: id,
                texte: newValue,
                modified_at: new Date().toISOString(),
              });
          }}
          disabled={collectivite.isReadOnly}
          autoFocus={!hasValue}
        />
      }
    />
  );
};
