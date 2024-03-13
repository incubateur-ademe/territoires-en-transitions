import {TableOptions} from 'react-table';

import EtatDesLieuxGraphs from './EtatDesLieuxGraphs';
import {ScoreRempli, ScoreVide} from './Scores';

import {ReferentielParamOption} from 'app/paths';
import {actionIdToLabel} from 'app/labels';
import {ProgressionRow} from '../data/useProgressionReferentiel';

type Props = {
  collectiviteId: number;
  progressionScore: Pick<
    TableOptions<ProgressionRow>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  repartitionPhases: {id: string; value: number}[];
  potentiel: number | undefined;
  referentiel: ReferentielParamOption;
  title: string;
};

/** Colonne "état des lieux" */
const EtatDesLieux = ({
  collectiviteId,
  progressionScore,
  repartitionPhases,
  potentiel,
  referentiel,
  title,
}: Props): JSX.Element => {
  const displayEtatDesLieux =
    progressionScore.data.find(d => d.score_non_renseigne !== 1) !== undefined;

  return (
    <div className="flex flex-col gap-6">
      {/** Scores */}
      {displayEtatDesLieux ? (
        <>
          <ScoreRempli
            collectiviteId={collectiviteId}
            referentiel={referentiel}
            title={title}
            progressionScore={progressionScore}
            potentiel={potentiel}
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
        <ScoreVide
          collectiviteId={collectiviteId}
          referentiel={referentiel}
          title={title}
          tags={progressionScore.data.map(d => ({
            label: actionIdToLabel[d.action_id] ?? d.nom,
            axeId: d.action_id,
          }))}
        />
      )}
    </div>
  );
};

export default EtatDesLieux;
