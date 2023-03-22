import {makeCollectivitePersoRefThematiqueUrl} from 'app/paths';
import {
  DetailNouvelleModificationWrapper,
  DetailPrecedenteModificationWrapper,
} from 'app/pages/collectivite/Historique/DetailModificationWrapper';
import Modification from 'app/pages/collectivite/Historique/Modification';
import {THistoriqueItem, THistoriqueItemProps} from '../types';
import {toPercentString} from 'utils/score';

/**
 * Modification d'une réponse à une question de personnalisation du référentiel
 */
const HistoriqueItemReponse = (props: THistoriqueItemProps) => {
  const {item} = props;
  const {collectivite_id, thematique_nom, thematique_id} = item;

  return (
    <Modification
      historique={item}
      icon="fr-fi-information-fill"
      nom="Caractéristique de la collectivité modifiée"
      descriptions={[{titre: 'Thématique', description: thematique_nom!}]}
      detail={<HistoriqueItemReponseDetails {...props} />}
      pageLink={makeCollectivitePersoRefThematiqueUrl({
        collectiviteId: collectivite_id,
        thematiqueId: thematique_id!,
      })}
    />
  );
};

export default HistoriqueItemReponse;

const HistoriqueItemReponseDetails = (props: THistoriqueItemProps) => {
  const {item} = props;
  const {previous_reponse, reponse, question_formulation, question_type} = item;

  return (
    <>
      <p>Question : {question_formulation}</p>
      {previous_reponse !== null ? (
        <DetailPrecedenteModificationWrapper>
          <span className="line-through">
            {formatReponseValue(previous_reponse, question_type)}
          </span>
        </DetailPrecedenteModificationWrapper>
      ) : null}
      <DetailNouvelleModificationWrapper>
        {formatReponseValue(reponse, question_type)}
      </DetailNouvelleModificationWrapper>
    </>
  );
};

const formatReponseValue = (
  value: THistoriqueItem['reponse'],
  type: THistoriqueItem['question_type']
) => {
  if (value === null) {
    return <i>Non renseigné</i>;
  }

  if (type === 'binaire') {
    return value ? 'Oui' : 'Non';
  }

  if (type === 'proportion') {
    return toPercentString(value as number);
  }
  return value;
};
