import { divisionOrZero } from '@tet/domain/utils';
import { actionIdToLabel } from '@/app/app/labels';
import { ReferentielId } from '@tet/domain/referentiels';
import { TableOptions } from 'react-table';
import type { ActionDetailed } from '../use-snapshot';
import { EtatDesLieuxGraphs } from './graphs/EtatDesLieuxGraphs';
import { ScoreRempli, ScoreVide } from './labellisation/Scores';

type Props = {
  isReadonly: boolean;
  collectiviteId: number;
  progressionScore: Pick<
    TableOptions<ActionDetailed>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  repartitionPhases: { id: string; value: number }[];
  potentiel: number | undefined;
  referentiel: ReferentielId;
  title: string;
};

/** Colonne "état des lieux" */
export const ReferentielCard = ({
  isReadonly,
  collectiviteId,
  progressionScore,
  repartitionPhases,
  potentiel,
  referentiel,
  title,
}: Props) => {
  const displayEtatDesLieux =
    (progressionScore.data as ActionDetailed[]).find(
      (d) =>
        divisionOrZero(d.score?.pointNonRenseigne ?? 0, d.score?.pointPotentiel ?? 0) !== 1
    ) !== undefined;

  return (
    <div className="flex flex-col gap-6">
      {/** Scores */}
      {displayEtatDesLieux ? (
        <>
          <ScoreRempli
            isReadonly={isReadonly}
            collectiviteId={collectiviteId}
            referentiel={referentiel}
            title={title}
            progressionScore={progressionScore}
            potentiel={potentiel}
          />

          <EtatDesLieuxGraphs
            referentiel={referentiel}
            displayEtatDesLieux={displayEtatDesLieux}
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
            tags={(progressionScore.data as ActionDetailed[]).map((d) => ({
              label: actionIdToLabel[d.actionId] ?? d.nom,
              axeId: d.actionId,
            }))}
          />
        </>
      )}
    </div>
  );
};
