import {
  DetailNouvelleModificationWrapper,
  DetailPrecedenteModificationWrapper,
} from '@/app/app/pages/collectivite/Historique/DetailModificationWrapper';
import Modification from '@/app/app/pages/collectivite/Historique/Modification';
import { makeMaCollectiviteUrl } from '@/app/app/paths';
import { HistoriqueItemPropsOf } from '../types';
import { formatReponseValue } from './formatReponseValue';

type Props = HistoriqueItemPropsOf<'reponse'>;

/**
 * Modification d'une réponse à une question de personnalisation du référentiel
 */
const HistoriqueItemReponse = ({ item }: Props) => {
  const { collectiviteId, thematiqueNom, thematiqueId } = item;

  return (
    <Modification
      historique={item}
      nom="Caractéristique de la collectivité modifiée"
      descriptions={[{ titre: 'Thématique', description: thematiqueNom ?? '' }]}
      detail={<HistoriqueItemReponseDetails item={item} />}
      pageLink={makeMaCollectiviteUrl({
        collectiviteId: collectiviteId,
        view: 'personnalisation',
        searchParams: thematiqueId
          ? { t: thematiqueId, ot: thematiqueId }
          : undefined,
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
      <p>Question : {questionFormulation}</p>
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
          Justification (lors de la réponse) : {justification}
        </p>
      )}
    </>
  );
};
