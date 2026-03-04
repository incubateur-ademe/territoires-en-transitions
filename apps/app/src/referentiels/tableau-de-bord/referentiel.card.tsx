import { actionIdToLabel } from '@/app/app/labels';
import { ReferentielId } from '@tet/domain/referentiels';
import { divisionOrZero } from '@tet/domain/utils';
import { TableOptions } from 'react-table';
import { ActionListItem } from '../actions/use-list-actions';
import { EtatDesLieuxGraphs } from './graphs/EtatDesLieuxGraphs';
import { ScoreRempli, ScoreVide } from './labellisation/Scores';

type Props = {
  isReadonly: boolean;
  collectiviteId: number;
  progressionScore: Pick<
    TableOptions<ActionListItem>,
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
    progressionScore.data.find(
      (d) =>
        divisionOrZero(d.score.pointNonRenseigne, d.score.pointPotentiel) !== 1
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
            tags={progressionScore.data.map((d) => ({
              label: actionIdToLabel[d.actionId] ?? d.nom,
              axeId: d.actionId,
            }))}
          />
        </>
      )}
    </div>
  );
};
