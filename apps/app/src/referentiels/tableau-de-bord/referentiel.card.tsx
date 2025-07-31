import { actionIdToLabel } from '@/app/app/labels';
import { ReferentielId } from '@/domain/referentiels';
import { TableOptions } from 'react-table';
import { ProgressionRow } from '../DEPRECATED_scores.types';
import IndicateursCard from './IndicateursCard';
import { EtatDesLieuxGraphs } from './graphs/EtatDesLieuxGraphs';
import { ScoreRempli, ScoreVide } from './labellisation/Scores';

type Props = {
  isReadonly: boolean;
  collectiviteId: number;
  progressionScore: Pick<
    TableOptions<ProgressionRow>,
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
    progressionScore.data.find((d) => d.score_non_renseigne !== 1) !==
    undefined;

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
          <IndicateursCard
            isReadonly={isReadonly}
            collectiviteId={collectiviteId}
            referentielId={referentiel}
          />
          {/** Autres graph */}
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
            tags={progressionScore.data.map((d) => ({
              label: actionIdToLabel[d.action_id] ?? d.nom,
              axeId: d.action_id,
            }))}
          />
          <IndicateursCard
            isReadonly={isReadonly}
            collectiviteId={collectiviteId}
            referentielId={referentiel}
          />
        </>
      )}
    </div>
  );
};
