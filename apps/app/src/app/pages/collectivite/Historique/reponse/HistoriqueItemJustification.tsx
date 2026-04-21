import {
  DetailNouvelleModificationWrapper,
  DetailPrecedenteModificationWrapper,
} from '@/app/app/pages/collectivite/Historique/DetailModificationWrapper';
import Modification from '@/app/app/pages/collectivite/Historique/Modification';
import { makeMaCollectiviteUrl } from '@/app/app/paths';
import { HistoriqueItemPropsOf } from '../types';
import { formatReponseValue } from './formatReponseValue';

type Props = HistoriqueItemPropsOf<'justification'>;

/**
 * Modification d'une justification d'une réponse à une question de
 * personnalisation du référentiel
 */
const HistoriqueItemJustification = ({ item }: Props) => {
  const { collectiviteId, thematiqueNom, thematiqueId } = item;

  return (
    <Modification
      historique={item}
      nom="Justification d'une caractéristique de la collectivité modifiée"
      descriptions={[{ titre: 'Thématique', description: thematiqueNom ?? '' }]}
      detail={<HistoriqueItemJustificationDetails item={item} />}
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
      <p>Question : {questionFormulation}</p>
      {reponse !== null && reponse !== undefined && (
        <p className="mt-4">
          Réponse (lors de la justification) :{' '}
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
