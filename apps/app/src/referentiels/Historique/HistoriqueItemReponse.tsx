import { appLabels } from '@/app/labels/catalog';
import {
  DetailNouvelleModificationWrapper,
  DetailPrecedenteModificationWrapper,
} from './DetailModificationWrapper';
import Modification from './Modification';
import { HistoriqueItemPropsOf } from './types';
import { formatReponseValue, makePersonnalisationQuestionLink } from './utils';

type Props = HistoriqueItemPropsOf<'reponse'>;

/**
 * Modification d'une réponse à une question de personnalisation du référentiel
 */
const HistoriqueItemReponse = ({ item }: Props) => {
  const { collectiviteId, thematiqueNom, thematiqueId, questionId } = item;

  return (
    <Modification
      historique={item}
      nom="Caractéristique de la collectivité modifiée"
      descriptions={[{ titre: 'Thématique', description: thematiqueNom ?? '' }]}
      detail={<HistoriqueItemReponseDetails item={item} />}
      pageLink={makePersonnalisationQuestionLink({
        collectiviteId,
        thematiqueId,
        questionId,
      })}
    />
  );
};

export default HistoriqueItemReponse;

const HistoriqueItemReponseDetails = (props: Props) => {
  const { item } = props;
  const {
    previousReponse,
    reponse,
    questionFormulation,
    questionType,
    justification,
  } = item;

  return (
    <>
      <p>
        {appLabels.questionLabel} {questionFormulation}
      </p>
      {previousReponse !== null ? (
        <DetailPrecedenteModificationWrapper>
          <span className="line-through">
            {formatReponseValue(previousReponse, questionType)}
          </span>
        </DetailPrecedenteModificationWrapper>
      ) : null}
      <DetailNouvelleModificationWrapper>
        {formatReponseValue(reponse, questionType)}
      </DetailNouvelleModificationWrapper>
      {justification && (
        <p className="mt-4">
          {appLabels.justificationLorsDeReponseLabel} {justification}
        </p>
      )}
    </>
  );
};
