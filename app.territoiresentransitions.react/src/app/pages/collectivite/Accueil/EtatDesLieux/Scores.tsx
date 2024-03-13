import {TableOptions} from 'react-table';

import logoTerritoireEngage from 'ui/logo/logoTerritoireEngage.png';
import LabellisationInfo from 'ui/labellisation/LabellisationInfo';
import Chart from 'ui/charts/Chart';
import AccueilCard from 'app/pages/collectivite/Accueil/AccueilCard';

import {
  ReferentielParamOption,
  makeCollectiviteLabellisationUrl,
  makeCollectivitePersoRefUrl,
  makeCollectiviteReferentielUrl,
} from 'app/paths';
import {toLocaleFixed} from 'utils/toFixed';
import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';
import {useCycleLabellisation} from 'app/pages/collectivite/ParcoursLabellisation/useCycleLabellisation';
import {getAggregatedScore} from 'app/pages/collectivite/Accueil/EtatDesLieux/utils';
import {ProgressionRow} from 'app/pages/collectivite/Accueil/data/useProgressionReferentiel';

import ButtonWithLink from 'ui/buttons/ButtonWithLink';

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
  const {parcours, status} = useCycleLabellisation(referentiel);
  const data = getAggregatedScore(progressionScore.data);

  return (
    <AccueilCard className="flex flex-col items-center xl:grid xl:grid-cols-2 gap-8">
      {/* Graphe donut */}
      <div className="w-full max-w-xs xl:order-2 xl:-mr-6">
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

      <div className="flex flex-col gap-6 mt-4">
        {/** Référentiel */}
        <div className="flex items-end gap-4">
          <img src={logoTerritoireEngage} alt="Logo Territoire Engage" />
          <div className="text-lg font-bold pb-1">{title}</div>
        </div>
        {/* Niveau de labellisation et détails */}
        <LabellisationInfo parcours={parcours} score={data} />

        {/* Call to action */}
        <ButtonWithLink
          onClick={() =>
            tracker({fonction: 'cta_labellisation', action: 'clic'})
          }
          href={makeCollectiviteLabellisationUrl({
            collectiviteId,
            referentielId: referentiel,
            labellisationVue: 'suivi',
          })}
          disabled={status === 'audit_en_cours' || status === 'demande_envoyee'}
          rounded
        >
          {status === 'audit_en_cours' || status === 'demande_envoyee'
            ? 'Demande envoyée'
            : 'Décrocher les étoiles'}
        </ButtonWithLink>
      </div>
    </AccueilCard>
  );
};

type ScoreVideProps = {
  collectiviteId: number;
  referentiel: ReferentielParamOption;
  title: string;
  tags: {label: string; axeId: string}[];
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
    <AccueilCard className="flex flex-col gap-11">
      {/* En-tête */}
      <div className="flex items-end gap-4">
        <img src={logoTerritoireEngage} alt="Logo Territoire Engage" />
        <div className="text-lg font-bold pb-1">{title}</div>
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
      <div className="grid md:grid-cols-2 gap-4">
        <ButtonWithLink
          onClick={() =>
            tracker({fonction: 'cta_edl_commencer', action: 'clic'})
          }
          href={makeCollectiviteReferentielUrl({
            collectiviteId,
            referentielId: referentiel,
            referentielVue: 'progression',
          })}
          rounded
        >
          Commencer l'état des lieux
        </ButtonWithLink>
        <ButtonWithLink
          onClick={() =>
            tracker({fonction: 'cta_edl_personnaliser', action: 'clic'})
          }
          href={makeCollectivitePersoRefUrl({collectiviteId})}
          rounded
          secondary
        >
          Personnaliser le référentiel
        </ButtonWithLink>
      </div>
    </AccueilCard>
  );
};
