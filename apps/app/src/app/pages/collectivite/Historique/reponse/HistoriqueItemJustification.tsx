import {
  DetailNouvelleModificationWrapper,
  DetailPrecedenteModificationWrapper,
} from '@/app/app/pages/collectivite/Historique/DetailModificationWrapper';
import Modification from '@/app/app/pages/collectivite/Historique/Modification';
import { makeCollectivitePersoRefThematiqueUrl } from '@/app/app/paths';
import { THistoriqueItemProps } from '../types';
import { formatReponseValue } from './formatReponseValue';

/**
 * Modification d'une justification d'une réponse à une question de
 * personnalisation du référentiel
 */
const HistoriqueItemJustification = ({ item }: THistoriqueItemProps) => {
  const { collectivite_id, thematique_nom, thematique_id } = item;

  return (
    <Modification
      historique={item}
      nom="Justification d'une caractéristique de la collectivité modifiée"
      descriptions={[
        { titre: 'Thématique', description: thematique_nom ?? '' },
      ]}
      detail={<HistoriqueItemJustificationDetails item={item} />}
      pageLink={makeCollectivitePersoRefThematiqueUrl({
        collectiviteId: collectivite_id,
        thematiqueId: thematique_id ?? '',
      })}
    />
  );
};

export default HistoriqueItemJustification;

const HistoriqueItemJustificationDetails = ({ item }: THistoriqueItemProps) => {
  const {
    justification,
    previous_justification,
    reponse,
    question_formulation,
    question_type,
  } = item;

  return (
    <>
      <p>Question : {question_formulation}</p>
      {reponse !== null && reponse !== undefined && (
        <p className="mt-4">
          Réponse (lors de la justification) :{' '}
          {formatReponseValue(reponse, question_type)}
        </p>
      )}
      {previous_justification !== null ? (
        <DetailPrecedenteModificationWrapper>
          <span className="line-through">{previous_justification}</span>
        </DetailPrecedenteModificationWrapper>
      ) : null}
      <DetailNouvelleModificationWrapper>
        {justification}
      </DetailNouvelleModificationWrapper>
    </>
  );
};
