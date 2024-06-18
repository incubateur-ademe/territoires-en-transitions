import {
  makeCollectiviteReferentielUrl,
  ReferentielParamOption,
} from 'app/paths';
import {TLabellisationParcours} from 'app/pages/collectivite/ParcoursLabellisation/types';
import {CritereRempli} from './CritereRempli';

export type TCritereScoreProps = {
  collectiviteId: number;
  parcours: TLabellisationParcours;
};

/**
 * Affiche le critère lié au remplissage du référentiel
 */
export const CritereCompletude = (props: TCritereScoreProps) => {
  const {collectiviteId, parcours} = props;
  const {completude_ok, referentiel} = parcours;
  const referentielId = referentiel as ReferentielParamOption;

  return (
    <>
      <li className="mb-2">Renseigner tous les statuts du référentiel</li>
      {completude_ok ? (
        <CritereRempli />
      ) : (
        <a
          className="fr-link fr-link--icon-right fr-fi-arrow-right-line mb-4"
          target="_blank"
          href={makeCollectiviteReferentielUrl({
            collectiviteId,
            referentielId,
            referentielVue: 'detail',
          })}
          rel="noreferrer"
        >
          Mettre à jour
        </a>
      )}
    </>
  );
};
