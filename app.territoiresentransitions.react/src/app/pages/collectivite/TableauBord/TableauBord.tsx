import {useCycleLabellisation} from 'app/pages/collectivite/ParcoursLabellisation/useCycleLabellisation';
import {
  makeCollectiviteLabellisationUrl,
  makeCollectiviteReferentielUrl,
  ReferentielParamOption,
} from 'app/paths';
import {actionAvancementColors} from 'app/theme';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {indicateurResultatRepository} from 'core-logic/api/repositories/AnyIndicateurRepository';
import {useAllIndicateurDefinitionsForGroup} from 'app/pages/collectivite/Indicateurs/useAllIndicateurDefinitions';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useReferentielDownToAction} from 'core-logic/hooks/referentiel';
import {ReferentielsActionScores, useScores} from 'core-logic/hooks/scoreHooks';
import {TLabellisationDemande} from 'app/pages/collectivite/ParcoursLabellisation/types';
import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {ActionScore} from 'types/ClientScore';
import {DoughnutWithNumber} from 'ui/charts/DoughnutWithNumber';
import {Spacer} from 'ui/shared/Spacer';
import {toFixed} from 'utils/toFixed';
import {NiveauLabellisation} from './NiveauLabellisation';
import {
  LabellisationParNiveauRead,
  useLabellisationParNiveau,
} from './useLabellisationParNiveau';
import {useTracker} from 'core-logic/hooks/useTracker';
import {TLabellisationParcours} from 'app/pages/collectivite/ParcoursLabellisation/types';
import ProgressionReferentiel from '../EtatDesLieux/Synthese/ProgressionReferentiel';
import {useProgressionReferentiel} from '../EtatDesLieux/Synthese/data/useProgressionReferentiel';
import ProgressionParPhase from '../EtatDesLieux/Synthese/ProgressionParPhase';
import {useRepartitionPhases} from '../EtatDesLieux/Synthese/data/useRepartitionPhases';

const remplissageColor = '#2F4077';

export type IndicateurCounts = {
  nbOfIndicateurswithValue: number;
  nbOfIndicateurs: number;
};

const useIndicateurCounts = (
  indicateurGroup: 'eci' | 'cae'
): IndicateurCounts => {
  const collectiviteId = useCollectiviteId();

  const [countIndicateurWithValue, setCountIndicateurWithValue] = useState(0);
  useEffect(() => {});
  const indicateurs = useAllIndicateurDefinitionsForGroup(indicateurGroup);

  useEffect(() => {
    if (collectiviteId) {
      Promise.all(
        indicateurs.map(indicateur =>
          indicateurResultatRepository.fetchIndicateurValuesForId({
            collectiviteId,
            indicateurId: indicateur.id,
          })
        )
      ).then(indicateursValues => {
        const countIndicateurWithValue = indicateursValues.filter(
          indicateurValues => {
            return indicateurValues.length > 0;
          }
        );
        setCountIndicateurWithValue(countIndicateurWithValue.length);
      });
    }
  }, [indicateurs.length, collectiviteId]);
  return {
    nbOfIndicateurswithValue: countIndicateurWithValue,
    nbOfIndicateurs: indicateurs.length,
  };
};

const scoreRealise = (rootScore: ActionScore) => {
  const realisePoints = toFixed(rootScore.point_fait, 1);
  const realisePercentage = (realisePoints / rootScore.point_potentiel) * 100;
  return {realisePoints, realisePercentage};
};

const ChiffreCles = ({
  collectiviteId,
  rootScore,
  referentiel,
  indicateurCounts,
}: {
  collectiviteId: number;
  rootScore: ActionScore;
  referentiel: 'eci' | 'cae';
  indicateurCounts: IndicateurCounts;
}) => {
  const bigFontSizePx = 30;
  const smallFontSizePx = 10;
  const widthPx = 120;
  // Action key numbers
  const {realisePoints, realisePercentage} = scoreRealise(rootScore);
  const {completed_taches_count, total_taches_count} = rootScore;

  const previsionnelPoints = toFixed(rootScore.point_programme, 1);
  const previsionnelPercentage =
    (previsionnelPoints / rootScore.point_potentiel) * 100;

  const keyNumberElementId = `${referentiel}_chiffres_cles`;
  return (
    <div>
      <div className="font-semibold text-center mb-4  text-xl">
        Chiffres clés
      </div>
      <div
        id={keyNumberElementId}
        className="flex flex-row justify-between items-center"
      >
        <div>
          <div className="font-light text-center mb-4">Taux de remplissage</div>
          <div className="flex flex-row">
            <DoughnutWithNumber
              bigFontSizePx={bigFontSizePx}
              smallFontSizePx={smallFontSizePx}
              bigText={completed_taches_count.toString()}
              smallText="actions renseignées"
              tooltipText={`${completed_taches_count} actions renseignées sur ${total_taches_count}.`}
              hexColor={remplissageColor}
              doughnutFillPercentage={
                (completed_taches_count / total_taches_count) * 100
              }
              widthPx={widthPx}
            />
            <DoughnutWithNumber
              bigFontSizePx={bigFontSizePx}
              smallFontSizePx={smallFontSizePx}
              bigText={indicateurCounts.nbOfIndicateurswithValue.toString()}
              smallText="indicateurs renseignés"
              tooltipText={`${indicateurCounts.nbOfIndicateurswithValue} indicateurs renseignés sur ${indicateurCounts.nbOfIndicateurs}.`}
              hexColor={remplissageColor}
              doughnutFillPercentage={
                (indicateurCounts.nbOfIndicateurswithValue /
                  indicateurCounts.nbOfIndicateurs) *
                100
              }
              widthPx={widthPx}
            />
          </div>
        </div>
        <div>
          <div className="font-light text-center mb-4">
            Scores réalisé et programmé
          </div>
          <div className="flex flex-row">
            <DoughnutWithNumber
              bigFontSizePx={bigFontSizePx}
              smallFontSizePx={smallFontSizePx}
              bigText={`${toFixed(realisePercentage, 1).toString()}%`}
              tooltipText={`${realisePoints} points réalisés sur ${toFixed(
                rootScore.point_potentiel,
                0
              )} potentiels.`}
              smallText="réalisé"
              hexColor={actionAvancementColors.fait}
              doughnutFillPercentage={realisePercentage}
              widthPx={widthPx}
            />
            <DoughnutWithNumber
              bigFontSizePx={bigFontSizePx}
              smallFontSizePx={smallFontSizePx}
              bigText={`${toFixed(previsionnelPercentage, 1).toString()}%`}
              tooltipText={`${previsionnelPoints} points programmés sur ${toFixed(
                rootScore.point_potentiel,
                0
              )} potentiels.`}
              smallText="programmé"
              hexColor={actionAvancementColors.programme}
              doughnutFillPercentage={previsionnelPercentage}
              widthPx={widthPx}
            />
          </div>
        </div>
      </div>
      {completed_taches_count < total_taches_count ? (
        <div className=" fr-mt-2w">
          <Link
            className="fr-link fr-link--icon-right fr-fi-arrow-right-line"
            to={makeCollectiviteReferentielUrl({
              collectiviteId,
              referentielId: referentiel,
              referentielVue: 'detail',
            })}
          >
            Voir les statuts non renseignés
          </Link>
        </div>
      ) : null}
    </div>
  );
};

const ReferentielSection = ({
  actions,
  demande,
  labellisationParNiveau,
  scores,
  referentielId,
  indicateurCounts,
  collectiviteId,
}: {
  actions: ActionDefinitionSummary[];
  demande: TLabellisationDemande | null;
  labellisationParNiveau: LabellisationParNiveauRead | null;
  scores: ActionScore[];
  referentielId: ReferentielParamOption;
  indicateurCounts: IndicateurCounts;
  collectiviteId: number;
}) => {
  const {table: progressionScore} = useProgressionReferentiel(referentielId);
  const repartitionPhases = useRepartitionPhases(referentielId);

  const referentielRoot = actions.find(a => a.type === 'referentiel');
  const tracker = useTracker();
  if (!referentielRoot) return null;

  const rootScore = scores.find(
    score => score.action_id === referentielRoot.id
  );

  if (!rootScore || rootScore.completed_taches_count === 0) {
    return (
      <div>
        <div
          style={{padding: '10px', height: '150px'}}
          className="flex items-center justify-center font-light"
        >
          Ce référentiel n’est pas encore renseigné pour votre collectivité.
          Pour commencer à visualiser votre progression, mettez à jour les
          statuts des actions.
        </div>
        <div className="flex justify-center">
          <Link
            className="fr-btn fr-btn--secondary "
            to={makeCollectiviteReferentielUrl({
              collectiviteId,
              referentielId,
            })}
          >
            Mettre à jour le référentiel
          </Link>
        </div>
      </div>
    );
  }

  const {realisePercentage} = scoreRealise(rootScore);

  return (
    <div className="p-4">
      {labellisationParNiveau ? (
        <NiveauLabellisation
          labellisationParNiveau={labellisationParNiveau}
          realisePercentage={realisePercentage}
        />
      ) : null}
      <div className="flex justify-center mb-8">
        {!demande || demande.en_cours ? (
          <Link
            className="fr-btn"
            onClick={() =>
              tracker({fonction: 'decrocher_les_etoiles', action: 'clic'})
            }
            to={makeCollectiviteLabellisationUrl({
              collectiviteId,
              referentielId,
            })}
          >
            Décrocher les étoiles
          </Link>
        ) : (
          <button className="fr-btn" disabled>
            Demande envoyée
          </button>
        )}
      </div>
      {rootScore && (
        <ChiffreCles
          collectiviteId={collectiviteId}
          rootScore={rootScore}
          referentiel={referentielId}
          indicateurCounts={indicateurCounts}
        />
      )}
      <Spacer />
      <ProgressionReferentiel
        score={progressionScore}
        referentiel={referentielId}
      />
      <Spacer />
      <ProgressionReferentiel
        score={progressionScore}
        referentiel={referentielId}
        percentage
      />
      <Spacer />
      <ProgressionParPhase
        repartitionPhases={repartitionPhases}
        referentiel={referentielId}
      />
    </div>
  );
};

export type TTableauBordProps = {
  scores: ReferentielsActionScores;
  actions: {eci: ActionDefinitionSummary[]; cae: ActionDefinitionSummary[]};
  demande: {
    eci: TLabellisationParcours['demande'] | null;
    cae: TLabellisationParcours['demande'] | null;
  };
  labellisationParNiveau: {
    eci: LabellisationParNiveauRead | null;
    cae: LabellisationParNiveauRead | null;
  };
  indicateurCounts: {eci: IndicateurCounts; cae: IndicateurCounts};
  collectiviteId: number;
};

export const TableauBord = ({
  scores,
  demande,
  labellisationParNiveau,
  actions,
  indicateurCounts,
  collectiviteId,
}: TTableauBordProps) => {
  return (
    <div data-test="TableauBord" className="bg-grey975">
      <div className="fr-container pt-9 pb-16">
        <main className="flex flex-row gap-4">
          <section style={{width: '600px'}} className="bg-white p-4">
            <div className="flex gap-4 justify-center font-bold text-center text-2xl text-gray">
              <div>Référentiel Climat Air Énergie</div>
            </div>
            <ReferentielSection
              collectiviteId={collectiviteId}
              referentielId="cae"
              actions={actions.cae}
              labellisationParNiveau={labellisationParNiveau.cae}
              scores={scores.cae}
              demande={demande.cae}
              indicateurCounts={indicateurCounts.cae}
            />
          </section>

          <section style={{width: '600px'}} className="bg-white p-4">
            <div className="flex gap-4 justify-center font-bold text-center text-2xl text-gray">
              <div>Référentiel Économie Circulaire</div>
            </div>
            <ReferentielSection
              collectiviteId={collectiviteId}
              referentielId="eci"
              actions={actions.eci}
              labellisationParNiveau={labellisationParNiveau.eci}
              scores={scores.eci}
              demande={demande.eci}
              indicateurCounts={indicateurCounts.eci}
            />
          </section>
        </main>
      </div>
    </div>
  );
};

const TableauBordConnected = () => {
  const eci_actions = useReferentielDownToAction('eci');
  const cae_actions = useReferentielDownToAction('cae');

  const eci_labellisationParNiveau = useLabellisationParNiveau('eci');
  const cae_labellisationParNiveau = useLabellisationParNiveau('cae');

  const eci_demande = useCycleLabellisation('eci')?.parcours?.demande || null;
  const cae_demande = useCycleLabellisation('cae')?.parcours?.demande || null;

  const eciIndicateurCounts = useIndicateurCounts('eci');
  const caeIndicateurCounts = useIndicateurCounts('cae');

  const collectiviteId = useCollectiviteId();

  const scores = useScores();

  if (!collectiviteId) return null;

  return (
    <TableauBord
      actions={{eci: eci_actions, cae: cae_actions}}
      demande={{eci: eci_demande, cae: cae_demande}}
      labellisationParNiveau={{
        eci: eci_labellisationParNiveau,
        cae: cae_labellisationParNiveau,
      }}
      scores={scores}
      indicateurCounts={{eci: eciIndicateurCounts, cae: caeIndicateurCounts}}
      collectiviteId={collectiviteId}
    />
  );
};

export default TableauBordConnected;
