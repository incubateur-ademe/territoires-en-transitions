import {makeCollectiviteTacheUrl, ReferentielParamOption} from 'app/paths';
import {useReferentielId} from 'core-logic/hooks/params';
import Modification from 'app/pages/collectivite/Historique/Modification';
import {THistoriqueItemProps} from '../types';
import {
  DetailNouvelleModificationWrapper,
  DetailPrecedenteModificationWrapper,
} from '../DetailModificationWrapper';
import classNames from 'classnames';

const HistoriqueItemActionPrecision = (props: THistoriqueItemProps) => {
  const referentielId = useReferentielId() as ReferentielParamOption;
  const {item} = props;
  const {
    action_id,
    action_identifiant,
    action_nom,
    tache_identifiant,
    tache_nom,
    collectivite_id,
  } = item;

  return (
    <Modification
      historique={item}
      icon="fr-fi-information-fill"
      nom="Action : texte modifié"
      descriptions={[
        {titre: 'Action', description: `${action_identifiant} ${action_nom}`},
        {titre: 'Tâche', description: `${tache_identifiant} ${tache_nom}`},
      ]}
      detail={<HistoriqueItemActionPrecisionDetails item={item} />}
      pageLink={makeCollectiviteTacheUrl({
        referentielId,
        collectiviteId: collectivite_id,
        actionId: action_id!,
      })}
    />
  );
};

export default HistoriqueItemActionPrecision;

const HistoriqueItemActionPrecisionDetails = (props: THistoriqueItemProps) => {
  const {item} = props;
  const {previous_precision, precision} = item;

  return (
    <>
      {previous_precision ? (
        <DetailPrecedenteModificationWrapper>
          {renderPrecision(previous_precision!, true)}
        </DetailPrecedenteModificationWrapper>
      ) : null}
      <DetailNouvelleModificationWrapper>
        {renderPrecision(precision!)}
      </DetailNouvelleModificationWrapper>
    </>
  );
};

const renderPrecision = (value: string, isPrevious?: boolean) => (
  <span
    className={classNames('whitespace-pre-line', {'line-through': isPrevious})}
  >
    {typeof value === 'string' && value.trim() !== '' ? (
      value
    ) : (
      <i>Non renseigné</i>
    )}
  </span>
);
