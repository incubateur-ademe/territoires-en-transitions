import { TableOptions } from 'react-table';

// import logoTerritoireEngage from 'ui/logo/logoTerritoireEngage.png';
import logoTerritoireEngage from 'ui/logo/logoTerritoireEngage_big.png';
import LabellisationInfo from '@tet/app/pages/collectivite/EtatDesLieux/Accueil/EtatDesLieux/labellisation/LabellisationInfo';
import Chart from 'ui/charts/Chart';

import {
  ReferentielParamOption,
  makeCollectiviteLabellisationUrl,
  makeCollectivitePersoRefUrl,
  makeCollectiviteReferentielUrl,
} from 'app/paths';
import { toLocaleFixed } from 'utils/toFixed';
import { useFonctionTracker } from 'core-logic/hooks/useFonctionTracker';
import { useCycleLabellisation } from 'app/pages/collectivite/ParcoursLabellisation/useCycleLabellisation';

import { Button } from '@tet/ui';
import { ProgressionRow } from '@tet/app/pages/collectivite/EtatDesLieux/Accueil/data/useProgressionReferentiel';
import { getAggregatedScore } from '@tet/app/pages/collectivite/EtatDesLieux/Accueil/EtatDesLieux/utils';
import AccueilCard from '@tet/app/pages/collectivite/EtatDesLieux/Accueil/EtatDesLieux/AccueilCard';

type ScoreRempliProps = {
  collectiviteId: number;
  referentiel: ReferentielParamOption;
  title: string;
  progressionScore: Pick<
    TableOptions<ProgressionRow>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  potentiel: number | undefined;
};

/** Carte "état des lieux" avec au moins 1 statut renseigné */
export const ScoreRempli = ({
  collectiviteId,
  referentiel,
  title,
  progressionScore,
  potentiel,
}: ScoreRempliProps): JSX.Element => {
  const tracker = useFonctionTracker();
  const { parcours, status } = useCycleLabellisation(referentiel);
  const data = getAggregatedScore(progressionScore.data);

  return (
    <AccueilCard className="flex flex-col items-center xl:flex-row xl:justify-between">
      {/* Graphe donut */}
      <div className="w-full max-w-xs xl:order-2">
        <Chart
          donut={{
            chart: {
              data: data.array,
              unit: 'point',
              displayPercentageValue: true,
              centeredElement: potentiel && (
                <div className="text-xs text-primary-10">
                  <div className="mb-1">Potentiel</div>
                  {`${toLocaleFixed(potentiel, 1)} point${
                    potentiel > 1 ? 's' : ''
                  }`}
                </div>
              ),
            },
          }}
        />
      </div>

      <div className="flex flex-col items-center xl:items-start gap-2 shrink-0">
        {/** Référentiel */}
        <div className="flex items-center justify-center gap-3 xl:flex-col xl:items-start xl:gap-0 xl:-mt-3">
          <img
            src={logoTerritoireEngage}
            alt="Logo Territoire Engage"
            className="w-12 xl:w-24"
          />
          <h6 className="text-lg font-bold uppercase m-0">{title}</h6>
        </div>
        {/* Niveau de labellisation et détails */}
        <LabellisationInfo parcours={parcours} score={data} />

        {/* Call to action */}
        <Button
          onClick={() =>
            tracker({ fonction: 'cta_labellisation', action: 'clic' })
          }
          href={makeCollectiviteLabellisationUrl({
            collectiviteId,
            referentielId: referentiel,
            labellisationVue: 'suivi',
          })}
          disabled={status === 'audit_en_cours' || status === 'demande_envoyee'}
          size="sm"
        >
          {status === 'audit_en_cours' || status === 'demande_envoyee'
            ? 'Demande envoyée'
            : 'Décrocher les étoiles'}
        </Button>
      </div>
    </AccueilCard>
  );
};

type ScoreVideProps = {
  collectiviteId: number;
  referentiel: ReferentielParamOption;
  title: string;
  tags: { label: string; axeId: string }[];
};

/** Carte "état des lieux" avec 0 statut renseigné */
export const ScoreVide = ({
  collectiviteId,
  referentiel,
  title,
  tags,
}: ScoreVideProps): JSX.Element => {
  const tracker = useFonctionTracker();

  return (
    <AccueilCard className="flex flex-col gap-7">
      {/* En-tête */}
      <div className="flex flex-col items-start xl:-mt-3">
        <img
          src={logoTerritoireEngage}
          alt="Logo Territoire Engage"
          className="w-24"
        />
        <h6 className="text-lg font-bold uppercase m-0">{title}</h6>
      </div>

      {/* Liste de tags */}
      <ul className="flex flex-wrap gap-4 mb-0">
        {tags.map((tag, index) => (
          <li key={index} className="pb-0">
            <a
              href={makeCollectiviteReferentielUrl({
                collectiviteId,
                referentielId: referentiel,
                referentielVue: 'progression',
                axeId: tag.axeId,
              })}
              className="fr-tag !text-[#ff5655] hover:!bg-[#ffcdc1] !bg-[#fddfd8]"
            >
              {tag.label}
            </a>
          </li>
        ))}
      </ul>

      {/* Call to action */}
      <div className="flex flex-col md:flex-row gap-4">
        <Button
          size="sm"
          onClick={() =>
            tracker({ fonction: 'cta_edl_commencer', action: 'clic' })
          }
          href={makeCollectiviteReferentielUrl({
            collectiviteId,
            referentielId: referentiel,
            referentielVue: 'progression',
          })}
        >
          Commencer l'état des lieux
        </Button>
        <Button
          size="sm"
          onClick={() =>
            tracker({ fonction: 'cta_edl_personnaliser', action: 'clic' })
          }
          href={makeCollectivitePersoRefUrl({ collectiviteId })}
        >
          Personnaliser le référentiel
        </Button>
      </div>
    </AccueilCard>
  );
};
