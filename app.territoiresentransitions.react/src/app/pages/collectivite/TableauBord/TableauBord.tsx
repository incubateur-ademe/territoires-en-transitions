import {useParcoursLabellisation} from 'app/pages/collectivite/ParcoursLabellisation/useParcoursLabellisation';
import {
  makeCollectiviteLabellisationUrl,
  makeCollectiviteReferentielUrl,
  ReferentielParamOption,
} from 'app/paths';
import {actionAvancementColors} from 'app/theme';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {indicateurResultatRepository} from 'core-logic/api/repositories/AnyIndicateurRepository';
import {useAllIndicateurDefinitionsForGroup} from 'core-logic/hooks/indicateur_definition';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useReferentielDownToAction} from 'core-logic/hooks/referentiel';
import {
  ReferentielsActionScores,
  useScores,
} from 'core-logic/observables/scoreHooks';
import {LabellisationDemandeRead} from 'generated/dataLayer/labellisation_demande_read';
import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {ActionScore} from 'types/ClientScore';
import {AxisAvancementSample} from 'ui/charts/chartTypes';
import {DoughnutWithNumber} from 'ui/charts/DoughnutWithNumber';
import {ReferentielAxisAvancementStackedBar} from 'ui/charts/ReferentielAxisAvancementStackedBar';
import {ReferentielAxisScoresPolarArea} from 'ui/charts/ReferentielAxisScoresPolarArea';
import {Spacer} from 'ui/shared/Spacer';
import {toFixed} from 'utils/toFixed';
import {NiveauLabellisation} from './NiveauLabellisation';
import {
  LabellisationParNiveauRead,
  useLabellisationParNiveau,
} from './useLabellisationParNiveau';

const remplissageColor = '#2F4077';

const axisLabels: Record<string, string[][]> = {
  eci_1: [['1. Stratégie globale']],
  eci_2: [
    ['2. Services de'],
    ['réduction, collecte et'],
    ['valorisation des déchets'],
  ],
  eci_3: [['3. Autres piliers'], ["de l'économie circulaire"]],
  eci_4: [['4. Outils financiers'], ['du changement'], ['de comportement']],
  eci_5: [['5. Coopération'], ['et engagement']],
  cae_1: [['1. Plannification'], ['territoriale']],
  cae_2: [['2. Patrimoine de la'], ['collectivité']],
  cae_3: [['3. Approvisionnement,'], ['énergie, eau,'], ['assainissement']],
  cae_4: [['4. Mobilité']],
  cae_5: [['5. Organisation'], ['interne']],
  cae_6: [['6. Coopération, '], ['communication']],
};

export type IndicateurCounts = {
  nbOfIndicateurswithValue: number;
  nbOfIndicateurs: number;
};

const useIndicateurCounts = (
  indicateurGroup: 'eci' | 'cae'
): IndicateurCounts => {
  const collectiviteId = useCollectiviteId();

  if (collectiviteId === null)
    return {
      nbOfIndicateurswithValue: 0,
      nbOfIndicateurs: 0,
    };

  const [countIndicateurWithValue, setCountIndicateurWithValue] = useState(0);
  useEffect(() => {});
  const indicateurs = useAllIndicateurDefinitionsForGroup(indicateurGroup);

  useEffect(() => {
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
  }, [indicateurs.length]);
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

  const previsionnelPoints = toFixed(
    rootScore.point_fait + rootScore.point_programme,
    1
  );
  const previsionnelPercentage =
    (previsionnelPoints / rootScore.point_potentiel) * 100;

  return (
    <div>
      <div className="font-semibold text-center mb-4  text-xl">
        Chiffres clés
      </div>
      <div className="flex flex-row justify-between items-center">
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
        <Link
          className="fr-link fr-link--icon-right fr-fi-arrow-right-line fr-mt-2w"
          to={makeCollectiviteReferentielUrl({
            collectiviteId,
            referentielId: referentiel,
            referentielVue: 'detail',
          })}
        >
          Voir les statuts non renseignés
        </Link>
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
  demande: LabellisationDemandeRead | null;
  labellisationParNiveau: LabellisationParNiveauRead | null;
  scores: ActionScore[];
  referentielId: ReferentielParamOption;
  indicateurCounts: IndicateurCounts;
  collectiviteId: number;
}) => {
  const referentielRoot = actions.find(a => a.type === 'referentiel');
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

  const referentielAxes: ActionDefinitionSummary[] = actions.filter(
    a => a.type === 'axe'
  );
  console.log('referentielAxes ', referentielAxes);
  const axisAvancementSamples: AxisAvancementSample[] = referentielAxes
    .map(axe => {
      const axisScore = scores.find(score => score.action_id === axe.id);
      if (!axisScore) return null;
      const sample: AxisAvancementSample = {
        label: axisLabels[axe.id],
        potentielPoints: toFixed(axisScore?.point_potentiel, 0),
        percentages: {
          fait: (axisScore.point_fait / axisScore.point_potentiel) * 100,
          programme:
            (axisScore.point_programme / axisScore.point_potentiel) * 100,
          pas_fait:
            (axisScore.point_pas_fait / axisScore.point_potentiel) * 100,
          non_renseigne:
            (axisScore.point_non_renseigne / axisScore.point_potentiel) * 100,
        },
      };
      return sample;
    })
    .filter((sample): sample is AxisAvancementSample => sample !== null);
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
      <div className="flex justify-center">
        <ReferentielAxisScoresPolarArea data={axisAvancementSamples} />
      </div>
      <Spacer />
      <ReferentielAxisAvancementStackedBar data={axisAvancementSamples} />
    </div>
  );
};

export type TTableauBordProps = {
  scores: ReferentielsActionScores;
  actions: {eci: ActionDefinitionSummary[]; cae: ActionDefinitionSummary[]};
  demande: {
    eci: LabellisationDemandeRead | null;
    cae: LabellisationDemandeRead | null;
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
    <div className="bg-grey975">
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

export default () => {
  const eci_actions = useReferentielDownToAction('eci');
  const cae_actions = useReferentielDownToAction('cae');

  const eci_labellisationParNiveau = useLabellisationParNiveau('eci');
  const cae_labellisationParNiveau = useLabellisationParNiveau('cae');

  const {demande: eci_demande} = useParcoursLabellisation('eci');
  const {demande: cae_demande} = useParcoursLabellisation('cae');

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
