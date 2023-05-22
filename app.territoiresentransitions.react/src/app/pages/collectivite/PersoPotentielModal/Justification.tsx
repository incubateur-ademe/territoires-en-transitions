import {useEffect, useState} from 'react';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {TQuestionReponseProps} from './PersoPotentielQR';
import {Accordion} from 'ui/Accordion';
import Textarea from 'ui/shared/form/Textarea';
import {useUpdateJustification} from './useUpdateJustification';

/**
 * Affiche le champ d'édtion de la justification d'une réponse
 * (ou un bouton pour affiche ce champ)
 */
export const Justification = (props: TQuestionReponseProps) => {
  const {qr} = props;
  const {reponse, justification, id} = qr;
  const collectivite = useCurrentCollectivite();
  const [value, setValue] = useState(justification);
  const {mutate: updateJustification} = useUpdateJustification();

  // synchronise la valeur initiale car la réponse est chargée de manière asynchrone
  useEffect(() => {
    setValue(justification);
  }, [justification]);

  if (!collectivite || reponse === undefined || reponse === null) {
    return null;
  }

  return (
    <Accordion
      id={`j-${id}`}
      className="fr-mt-2w"
      titre="Justifier votre réponse (optionnel)"
      icon="fr-icon-draft-line"
      initialState={Boolean(value)}
      html={
        <Textarea
          className="fr-input"
          value={value || ''}
          onInputChange={() => null}
          onChange={evt => setValue(evt.currentTarget.value)}
          onBlur={() => {
            const newValue = value?.trim() || '';
            if (newValue !== (justification || ''))
              updateJustification({
                collectivite_id: collectivite.collectivite_id,
                question_id: id,
                texte: newValue,
                modified_at: new Date().toISOString(),
              });
          }}
          disabled={collectivite.readonly}
          autoFocus
        />
      }
    />
  );
};
