'use client';

import { appLabels } from '@/app/labels/catalog';
import { TLabellisationParcours } from '@/app/referentiels/labellisations/types';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Alert } from '@tet/ui';
import { TPreuveLabellisation } from '../preuves/Bibliotheque/types';
import { useReferentielId } from '../referentiel-context';
import { CritereCompletude } from './CritereCompletude';
import { CriterePreuves } from './CriterePreuves';
import { CritereScore } from './CritereScore';
import { CriteresAction } from './CriteresAction';
import { numLabels } from './numLabels';
import {
  useCycleLabellisation,
  usePreuvesLabellisation,
} from './useCycleLabellisation';

export type TCriteresLabellisationProps = {
  collectiviteId: number;
  parcours: TLabellisationParcours;
  preuves: TPreuveLabellisation[];
  isCOT: boolean;
};

/**
 * Affiche la liste des critères à remplir pour un niveau de labellisation
 */
export const CriteresLabellisation = (props: TCriteresLabellisationProps) => {
  const { parcours } = props;
  const { etoiles, critere_score } = parcours;
  const { atteint, score_a_realiser } = critere_score;

  return (
    <>
      <p className="text-grey-6">
        {appLabels.premierNiveauLabellisationSansAudit}
      </p>
      {etoiles !== 1 && atteint ? (
        <Alert
          className="mb-4"
          title={appLabels.bravoSeuilAtteintEtoileSuivante({
            scorePercent: String(Math.round(score_a_realiser * 100)),
            numLabel: numLabels[etoiles],
          })}
        />
      ) : null}
      <h2 className="mb-6">{appLabels.criteresDeLabellisation}</h2>
      <ul className="mb-6">
        <CritereCompletude {...props} />
        {etoiles !== 1 ? <CritereScore {...props} /> : null}
        <CriteresAction {...props} />
        <CriterePreuves {...props} />
      </ul>
    </>
  );
};

const CriteresLabellisationConnected = () => {
  const collectiviteId = useCollectiviteId();
  const referentiel = useReferentielId();
  const { parcours, isCOT } = useCycleLabellisation(referentiel);
  const { data: preuves } = usePreuvesLabellisation(parcours?.demande?.id);

  return collectiviteId && parcours ? (
    <CriteresLabellisation
      collectiviteId={collectiviteId}
      parcours={parcours}
      preuves={(preuves ?? []) as unknown as TPreuveLabellisation[]} // TODO: remove this when front is completely updated
      isCOT={isCOT}
    />
  ) : null;
};

export default CriteresLabellisationConnected;
