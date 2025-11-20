import { makeReferentielUrl } from '@/app/app/paths';
import { TLabellisationParcours } from '@/app/referentiels/labellisations/types';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { Button } from '@tet/ui';
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
      <li className="mt-4 mb-2">
        {`Atteindre un score réalisé (statut Fait) d’au moins ${toLocaleFixed(
          score_a_realiser * 100
        )} % et le prouver (via les documents preuves ou un texte justificatif)`}
      </li>
      {atteint ? (
        <CritereRempli />
      ) : (
        <Button
          variant="underlined"
          size="sm"
          icon="arrow-right-line"
          iconPosition="right"
          external
          href={makeReferentielUrl({
            collectiviteId,
            referentielId,
          })}
        >
          Mettre à jour
        </Button>
      )}
    </>
  );
};
