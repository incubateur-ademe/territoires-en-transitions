import {ReferentielParamOption} from 'app/paths';
import classNames from 'classnames';
import {TableOptions} from 'react-table';
import {ProgressionRow} from '../EtatDesLieux/Synthese/data/useProgressionReferentiel';
import ProgressionParPhase from '../EtatDesLieux/Synthese/ProgressionParPhase';
import ProgressionReferentiel from '../EtatDesLieux/Synthese/ProgressionReferentiel';

type EtatDesLieuxGraphsProps = {
  referentiel: ReferentielParamOption;
  displayEtatDesLieux: boolean;
  progressionScore: Pick<
    TableOptions<ProgressionRow>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  repartitionPhases: {id: string; value: number}[];
  className?: string;
};

/**
 * Affichage des graphiques sous les cartes "état des lieux"
 */

const EtatDesLieuxGraphs = ({
  referentiel,
  displayEtatDesLieux,
  progressionScore,
  repartitionPhases,
  className,
}: EtatDesLieuxGraphsProps): JSX.Element => {
  const graphStyles = {
    boxShadow: '0px 2px 16px 0px #0063CB0A, 0px 4px 6px 0px #0063CB0F',
    border: 'none',
    borderRadius: '8px',
  };

  return displayEtatDesLieux ? (
    <div className={classNames('flex flex-col gap-6', className)}>
      <ProgressionReferentiel
        score={progressionScore}
        referentiel={referentiel}
        customStyle={graphStyles}
      />
      <ProgressionReferentiel
        score={progressionScore}
        referentiel={referentiel}
        percentage
        customStyle={graphStyles}
      />
      <ProgressionParPhase
        repartitionPhases={repartitionPhases}
        referentiel={referentiel}
        customStyle={graphStyles}
      />
    </div>
  ) : (
    <div className={className}></div>
  );
};

export default EtatDesLieuxGraphs;
