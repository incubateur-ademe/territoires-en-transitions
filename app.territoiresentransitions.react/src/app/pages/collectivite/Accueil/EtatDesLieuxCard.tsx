import {actionIdToLabel} from 'app/labels';
import {
  makeCollectiviteLabellisationUrl,
  makeCollectivitePersoRefUrl,
  makeCollectiviteReferentielUrl,
  ReferentielParamOption,
} from 'app/paths';
import classNames from 'classnames';
import {TableOptions} from 'react-table';
import ButtonWithLink from 'ui/buttons/ButtonWithLink';
import DonutChart from 'ui/charts/DonutChart';
import logoTerritoireEngage from 'ui/logo/logoTerritoireEngage.png';
import {ProgressionRow} from '../EtatDesLieux/Synthese/data/useProgressionReferentiel';
import {getAggregatedScore} from '../EtatDesLieux/Synthese/utils';
import {useCycleLabellisation} from '../ParcoursLabellisation/useCycleLabellisation';
import AccueilCard from './AccueilCard';
import EtatDesLieuxGraphs from './EtatDesLieuxGraphs';
import LabellisationInfo from '../../../../ui/labellisation/LabellisationInfo';
import {toLocaleFixed} from 'utils/toFixed';

type EtatDesLieuxCardProps = {
  collectiviteId: number;
  progressionScore: Pick<
    TableOptions<ProgressionRow>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  repartitionPhases: {id: string; value: number}[];
  potentiel: number | undefined;
  referentiel: ReferentielParamOption;
  title: string;
  className?: string;
};

type EmptyEtatDesLieuxCardProps = {
  collectiviteId: number;
  referentiel: ReferentielParamOption;
  title: string;
  tags: {label: string; axeId: string}[];
  className?: string;
};

type FilledEtatDesLieuxCardProps = {
  collectiviteId: number;
  referentiel: ReferentielParamOption;
  title: string;
  progressionScore: Pick<
    TableOptions<ProgressionRow>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  potentiel: number | undefined;
  className?: string;
};

const getTags = (scoreData: readonly ProgressionRow[]) => {
  return scoreData.map(d => ({
    label: actionIdToLabel[d.action_id] ?? d.nom,
    axeId: d.action_id,
  }));
};

/**
 * Carte "état des lieux"
 */

const EtatDesLieuxCard = ({
  collectiviteId,
  progressionScore,
  repartitionPhases,
  potentiel,
  referentiel,
  title,
  className,
}: EtatDesLieuxCardProps): JSX.Element => {
  const displayEtatDesLieux =
    progressionScore.data.find(d => d.score_non_renseigne !== 1) !== undefined;

  return (
    <>
      {displayEtatDesLieux ? (
        <FilledEtatDesLieuxCard
          collectiviteId={collectiviteId}
          referentiel={referentiel}
          title={title}
          progressionScore={progressionScore}
          potentiel={potentiel}
          className={className}
        />
      ) : (
        <EmptyEtatDesLieuxCard
          collectiviteId={collectiviteId}
          referentiel={referentiel}
          title={title}
          tags={getTags(progressionScore.data)}
          className={className}
        />
      )}
      <EtatDesLieuxGraphs
        referentiel={referentiel}
        displayEtatDesLieux={displayEtatDesLieux}
        progressionScore={progressionScore}
        repartitionPhases={repartitionPhases}
        className={referentiel === 'cae' ? 'lg:order-3 order-2' : 'order-4'}
      />
    </>
  );
};

export default EtatDesLieuxCard;

/**
 * Carte "état des lieux" avec au moins 1 statut renseigné
 */

const FilledEtatDesLieuxCard = ({
  collectiviteId,
  referentiel,
  title,
  progressionScore,
  potentiel,
  className,
}: FilledEtatDesLieuxCardProps): JSX.Element => {
  const {parcours, status} = useCycleLabellisation(referentiel);
  const data = getAggregatedScore(progressionScore.data);

  return (
    <AccueilCard className={classNames('flex flex-col relative', className)}>
      {/* En-tête */}
      <div className="flex items-end gap-4 md:pb-0 pb-8">
        <img src={logoTerritoireEngage} alt="Logo Territoire Engage" />
        <div className="text-lg font-bold pb-1">{title}</div>
      </div>

      {/* Contenu */}
      <div className="h-full grid md:grid-cols-2 gap-8 self-stretch">
        <div className="flex flex-col justify-between">
          {/* Niveau de labellisation et détails */}
          <LabellisationInfo parcours={parcours} score={data} />

          {/* Call to action */}
          <ButtonWithLink
            href={makeCollectiviteLabellisationUrl({
              collectiviteId,
              referentielId: referentiel,
              labellisationVue: 'suivi',
            })}
            disabled={
              status === 'audit_en_cours' || status === 'demande_envoyee'
            }
            rounded
          >
            {status === 'audit_en_cours' || status === 'demande_envoyee'
              ? 'Demande envoyée'
              : 'Décrocher les étoiles'}
          </ButtonWithLink>
        </div>

        {/* Graphe donut */}
        <div className="h-[200px] w-[246px] mx-auto md:order-last order-first md:absolute md:top-1/2 md:right-1/4 md:-translate-y-1/2 md:translate-x-[47%] static">
          <DonutChart
            data={data.array}
            centeredMetric={
              potentiel !== undefined
                ? {
                    title: 'Potentiel',
                    value: `${toLocaleFixed(potentiel, 1)} point${
                      potentiel > 1 ? 's' : ''
                    }`,
                  }
                : undefined
            }
            customMargin={{top: 2, right: 0, bottom: 2, left: 0}}
            zoomEffect={false}
            unit="point"
            displayPercentageValue
          />
        </div>
      </div>
    </AccueilCard>
  );
};

/**
 * Carte "état des lieux" avec 0 statut renseigné
 */

const EmptyEtatDesLieuxCard = ({
  collectiviteId,
  referentiel,
  title,
  tags,
  className,
}: EmptyEtatDesLieuxCardProps): JSX.Element => {
  return (
    <AccueilCard className={classNames('flex flex-col gap-8', className)}>
      {/* En-tête */}
      <div className="flex items-end gap-4">
        <img src={logoTerritoireEngage} alt="Logo Territoire Engage" />
        <div className="text-lg font-bold pb-1">{title}</div>
      </div>

      {/* Liste de tags */}
      <ul className="fr-tags-group">
        {tags.map((tag, index) => (
          <li key={index}>
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
