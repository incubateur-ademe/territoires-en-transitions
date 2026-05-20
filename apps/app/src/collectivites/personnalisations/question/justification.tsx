import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Icon, Textarea } from '@tet/ui';
import { isNil } from 'es-toolkit';
import { useEffect, useState } from 'react';
import { useSetPersonnalisationJustification } from '../data/use-set-personnalisation-justification';
import { QuestionReponseProps } from './question-reponse-props.types';

/**
 * Champ de justification d'une réponse à une question de personnalisation
 */
export const Justification = (props: QuestionReponseProps) => {
  const { question, reponse, canEdit } = props;
  const { id, type, consignesJustification } = question;
  const { reponse: reponseValue, justification } = reponse || {};
  const { collectiviteId } = useCurrentCollectivite();
  const [value, setValue] = useState(justification);
  const { mutateAsync: saveJustification } =
    useSetPersonnalisationJustification(collectiviteId);

  // synchronise la valeur initiale car la réponse est chargée de manière asynchrone
  useEffect(() => {
    setValue(justification);
  }, [justification]);

  const showLabelBanatic =
    reponse &&
    !isNil(reponse.competenceExercee) &&
    !isNil(reponseValue) &&
    reponse.competenceExercee !== reponseValue;

  return (
    <>
      {showLabelBanatic && (
        <p className="text-warning-1 mb-2">
          <Icon icon="alert-fill" />
          <span className="font-normal text-xs">
            {appLabels.reponseDifferenteBanatic}
          </span>
        </p>
      )}
      {reponse?.natureTransfert && (
        <p className="font-normal text-xs mb-2">
          {appLabels.transfertVers} {reponse.natureTransfert}
        </p>
      )}
      <Textarea
        className="font-normal"
        id={`j-${id}`}
        value={value || ''}
        placeholder={consignesJustification || appLabels.defaultJustificationPlaceholder}
        onChange={(evt) => setValue(evt.currentTarget.value)}
        onBlur={() => {
          const newValue = value?.trim() ?? '';
          if (newValue !== (justification ?? ''))
            saveJustification({
              questionId: question.id,
              questionType: type,
              reponse: reponseValue,
              justification: newValue,
            });
        }}
        disabled={!canEdit}
      />
    </>
  );
};
