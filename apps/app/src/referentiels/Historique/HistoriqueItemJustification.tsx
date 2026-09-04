import { appLabels } from '@/app/labels/catalog';
import {
  DetailNouvelleModificationWrapper,
  DetailPrecedenteModificationWrapper,
} from './DetailModificationWrapper';
import Modification from './Modification';
import { HistoriqueItemPropsOf } from './types';
import { formatReponseValue, makePersonnalisationQuestionLink } from './utils';

type Props = HistoriqueItemPropsOf<'justification'>;

/**
 * Modification d'une justification d'une réponse à une question de
 * personnalisation du référentiel
 */
const HistoriqueItemJustification = ({ item }: Props) => {
  const { collectiviteId, thematiqueNom, thematiqueId, questionId } = item;

  return (
    <Modification
      historique={item}
      nom="Justification d'une caractéristique de la collectivité modifiée"
      descriptions={[{ titre: 'Thématique', description: thematiqueNom ?? '' }]}
      detail={<HistoriqueItemJustificationDetails item={item} />}
      pageLink={makePersonnalisationQuestionLink({
        collectiviteId,
        thematiqueId,
        questionId,
      })}
    />
  );
};

export default HistoriqueItemJustification;

const HistoriqueItemJustificationDetails = ({ item }: Props) => {
  const {
    justification,
    previousJustification,
    reponse,
    questionFormulation,
    questionType,
  } = item;

  return (
    <>
      <p>
        {appLabels.questionLabel} {questionFormulation}
      </p>
      {reponse !== null && reponse !== undefined && (
        <p className="mt-4">
          {appLabels.reponseLorsDeJustificationLabel}{' '}
          {formatReponseValue(reponse, questionType)}
        </p>
      )}
      {previousJustification !== null ? (
        <DetailPrecedenteModificationWrapper>
          <span className="line-through">{previousJustification}</span>
        </DetailPrecedenteModificationWrapper>
      ) : null}
      <DetailNouvelleModificationWrapper>
        {justification}
      </DetailNouvelleModificationWrapper>
    </>
  );
};
