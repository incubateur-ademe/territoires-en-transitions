import {makeCollectivitePersoRefThematiqueUrl} from 'app/paths';
import {
  DetailNouvelleModificationWrapper,
  DetailPrecedenteModificationWrapper,
} from 'app/pages/collectivite/Historique/DetailModificationWrapper';
import Modification from 'app/pages/collectivite/Historique/Modification';
import {THistoriqueItemProps} from '../types';
import {formatReponseValue} from './formatReponseValue';

/**
 * Modification d'une justification d'une réponse à une question de
 * personnalisation du référentiel
 */
const HistoriqueItemJustification = (props: THistoriqueItemProps) => {
  const {item} = props;
  const {collectivite_id, thematique_nom, thematique_id} = item;

  return (
    <Modification
      historique={item}
      icon="fr-fi-information-fill"
      nom="Justification d'une caractéristique de la collectivité modifiée"
      descriptions={[{titre: 'Thématique', description: thematique_nom!}]}
      detail={<HistoriqueItemJustificationDetails {...props} />}
      pageLink={makeCollectivitePersoRefThematiqueUrl({
        collectiviteId: collectivite_id,
        thematiqueId: thematique_id!,
      })}
    />
  );
};

export default HistoriqueItemJustification;

const HistoriqueItemJustificationDetails = (props: THistoriqueItemProps) => {
  const {item} = props;
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
        <p className="fr-mt-2w">
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
