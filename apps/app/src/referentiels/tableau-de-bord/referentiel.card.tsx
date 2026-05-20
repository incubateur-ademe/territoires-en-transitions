import { ReferentielId } from '@tet/domain/referentiels';
import { EtatDesLieuxGraphs } from './graphs/EtatDesLieuxGraphs';
import { ScoreRempli, ScoreVide } from './labellisation/Scores';
import { ReferentielCardSkeleton } from './referentiel-card.skeleton';
import { useTableauDeBordReferentielData } from './useTableauDeBordReferentielData';

type Props = {
  isReadonly: boolean;
  collectiviteId: number;
  referentiel: ReferentielId;
  title: string;
};

/** Colonne "état des lieux" */
export const ReferentielCard = ({
  isReadonly,
  collectiviteId,
  referentiel,
  title,
}: Props) => {
  const {
    axes,
    potentiel,
    hasEtatDesLieux,
    repartitionPhases,
    progressionScore,
    isPending,
  } = useTableauDeBordReferentielData({
    referentielId: referentiel,
    collectiviteId,
  });

  if (isPending) {
    return <ReferentielCardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/** Scores */}
      {hasEtatDesLieux ? (
        <>
          <ScoreRempli
            isReadonly={isReadonly}
            collectiviteId={collectiviteId}
            referentiel={referentiel}
            title={title}
            axes={axes}
            potentiel={potentiel}
          />

          <EtatDesLieuxGraphs
            referentiel={referentiel}
            displayEtatDesLieux={hasEtatDesLieux}
            progressionScore={progressionScore}
            repartitionPhases={repartitionPhases}
          />
        </>
      ) : (
        <>
          <ScoreVide
            isReadonly={isReadonly}
            collectiviteId={collectiviteId}
            referentiel={referentiel}
            title={title}
            axes={axes}
          />
        </>
      )}
    </div>
  );
};
