import {
  makeCollectiviteReferentielUrl,
  ReferentielParamOption,
} from 'app/paths';
import {TLabellisationParcours} from 'app/pages/collectivite/ParcoursLabellisation/types';
import {toLocaleFixed} from 'utils/toFixed';
import {CritereRempli} from './CritereRempli';

export type TCritereScoreProps = {
  collectiviteId: number;
  parcours: TLabellisationParcours;
};

/**
 * Affiche le critère lié au score courant/score requis
 */
export const CritereScore = (props: TCritereScoreProps) => {
  const {collectiviteId, parcours} = props;
  const {critere_score, referentiel} = parcours;
  const {atteint, score_a_realiser} = critere_score;
  const referentielId = referentiel as ReferentielParamOption;

  return (
    <>
      <li className="mt-4 mb-2">
        {`Atteindre un score d’au moins ${toLocaleFixed(
          score_a_realiser * 100
        )} % d’actions réalisées et le prouver (via les documents preuves ou un texte justificatif)`}
      </li>
      {atteint ? (
        <CritereRempli />
      ) : (
        <a
          className="fr-link fr-link--icon-right fr-fi-arrow-right-line mb-4"
          target="_blank"
          href={makeCollectiviteReferentielUrl({
            collectiviteId,
            referentielId,
          })}
          rel="noreferrer"
        >
          Mettre à jour
        </a>
      )}
    </>
  );
};
