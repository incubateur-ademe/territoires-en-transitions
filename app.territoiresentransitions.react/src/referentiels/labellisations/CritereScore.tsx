import {
  makeCollectiviteReferentielUrl,
} from '@/app/app/paths';
import { TLabellisationParcours } from '@/app/referentiels/labellisations/types';
import { toLocaleFixed } from '@/app/utils/toFixed';
import { CritereRempli } from './CritereRempli';

export type TCritereScoreProps = {
  collectiviteId: number;
  parcours: TLabellisationParcours;
};

/**
 * Affiche le critère lié au score courant/score requis
 */
export const CritereScore = (props: TCritereScoreProps) => {
  const { collectiviteId, parcours } = props;
  const { critere_score, referentiel } = parcours;
  const { atteint, score_a_realiser } = critere_score;
  const referentielId = referentiel;

  return (
    <>
      <li className="fr-mt-2w fr-mb-1w">
        {`Atteindre un score d’au moins ${toLocaleFixed(
          score_a_realiser * 100
        )} % d’actions réalisées et le prouver (via les documents preuves ou un texte justificatif)`}
      </li>
      {atteint ? (
        <CritereRempli />
      ) : (
        <a
          className="fr-link fr-link--icon-right fr-fi-arrow-right-line fr-mb-2w"
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
