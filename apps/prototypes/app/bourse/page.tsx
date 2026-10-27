'use client';

import {
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  ButtonGroup,
  Card,
  Grid,
  Inline,
  PageHeader,
  Stack,
  Tag,
} from '@tet/ui';
import { useState } from 'react';
import {
  activites,
  budgetPrevisionnel,
  calendrier,
  consommations,
  description,
  etapes,
  fiche,
  fildAriane,
  financements,
  indicateursLies,
  objectifConsommation,
  pilotage,
  referentiels,
  SectionId,
  sections,
} from './fixtures';
import { ActivityList } from './proposals/activity-list';
import { ConsumptionChart } from './proposals/consumption-chart';
import { IndicatorsTable } from './proposals/indicators-table';
import { AmountList, DefinitionList } from './proposals/key-value-list';
import { KpiCard } from './proposals/kpi-card';
import { ProgressBar } from './proposals/progress-bar';
import { StepsList } from './proposals/steps-list';
import { TwoColumns } from './proposals/two-columns';

export default function BoursePage() {
  const [section, setSection] = useState<SectionId>('suivi');

  return (
    <Stack gap="lg">
      <PageHeader>
        <PageHeader.Navigation label="Fil d'Ariane">
          <Breadcrumbs items={[...fildAriane]} size="xs" />
        </PageHeader.Navigation>
        <PageHeader.Title>
          {fiche.numero} {fiche.titre}
        </PageHeader.Title>
        <PageHeader.Actions>
          <Button variant="outlined" size="sm" icon="download-line">
            Télécharger
          </Button>
          <Button variant="outlined" size="sm" icon="share-line">
            Partager
          </Button>
          <Button variant="primary" size="sm" icon="edit-line">
            Modifier
          </Button>
        </PageHeader.Actions>
        <PageHeader.Metadata>
          <PageHeader.MetadataRow>
            <Badge title="En cours" variant="info" size="sm" />
            <Badge title="Priorité élevée" variant="high" size="sm" />
            <Badge
              title="Mutualisée"
              variant="standard"
              type="outlined"
              size="sm"
            />
            <span className="text-sm text-grey-8">
              Modifiée le {fiche.modifieeLe} par {fiche.modifieePar}
            </span>
          </PageHeader.MetadataRow>
        </PageHeader.Metadata>
      </PageHeader>

      <Grid columns={{ base: 1, md: 2, lg: 4 }} gap="md">
        <KpiCard
          label="Avancement"
          value="62 %"
          caption="8 étapes réalisées sur 13"
        >
          <ProgressBar value={0.62} label="Avancement : 62 %" />
        </KpiCard>
        <KpiCard
          label="Budget engagé"
          value="1,24 M€"
          caption="sur 2,10 M€ prévus (59 %)"
        >
          <ProgressBar
            value={0.59}
            label="59 % du budget prévisionnel engagé"
          />
        </KpiCard>
        <KpiCard
          label="Consommation 2025"
          value="6 920 MWh"
          caption="Objectif 2030 : 5 070 MWh (−40 %)"
        >
          <Inline>
            <Badge title="−18 % vs 2019" variant="success" size="sm" />
          </Inline>
        </KpiCard>
        <KpiCard
          label="Prochaine échéance"
          value="15 déc. 2026"
          caption="Réception des travaux du groupe scolaire Jean Moulin"
        >
          <Inline>
            <Badge title="Dans 49 jours" variant="warning" size="sm" />
          </Inline>
        </KpiCard>
      </Grid>

      <ButtonGroup
        size="sm"
        label="Sections de la fiche"
        activeButtonId={section}
        buttons={sections.map(({ id, label }) => ({
          id,
          children: label,
          onClick: () => setSection(id),
        }))}
      />

      <Alert
        state="warning"
        title="Trajectoire en retard sur l'objectif 2026"
        description="La consommation 2025 (6 920 MWh) dépasse de 314 MWh la trajectoire prévue (6 606 MWh). Les travaux du gymnase, décalés au 2e trimestre 2027, en sont la principale cause."
      />

      <TwoColumns
        main={
          <>
            <Card>
              <h2>Description</h2>
              <p className="font-normal text-primary-10">{description.texte}</p>
              <Stack gap="sm" className="font-normal">
                <h3>Objectifs</h3>
                <Stack as="ul" gap="xs" className="list-disc pl-5 text-sm">
                  {description.objectifs.map((objectif) => (
                    <li key={objectif}>{objectif}</li>
                  ))}
                </Stack>
              </Stack>
              <Inline gap="sm">
                {description.etiquettes.map(({ titre, creee }) => (
                  <Tag key={titre} title={titre} isUserCreated={creee} />
                ))}
              </Inline>
            </Card>

            <Card>
              <Inline justify="between" align="center" gap="sm">
                <h2>Indicateurs liés</h2>
                <Button variant="grey" size="xs" icon="add-line">
                  Lier un indicateur
                </Button>
              </Inline>
              <Stack as="figure" gap="sm">
                <figcaption className="text-sm">
                  Consommation énergétique des bâtiments communaux (MWh/an)
                </figcaption>
                <ConsumptionChart
                  resultats={consommations}
                  objectif={objectifConsommation}
                  label="Consommation de 8 450 MWh en 2019 à 6 920 MWh en 2025, objectif 5 070 MWh en 2030"
                />
                <Inline gap="md" className="text-xs font-normal text-grey-8">
                  <span>Résultats</span>
                  <span>Trajectoire objectif (pointillés)</span>
                </Inline>
              </Stack>
              <IndicatorsTable indicateurs={indicateursLies} />
            </Card>

            <Card>
              <Inline justify="between" align="center" gap="sm">
                <h2>Étapes</h2>
                <Button variant="grey" size="xs" icon="add-line">
                  Ajouter une étape
                </Button>
              </Inline>
              <StepsList etapes={etapes} />
            </Card>
          </>
        }
        aside={
          <>
            <Card>
              <h3>Pilotage</h3>
              <DefinitionList items={pilotage} />
            </Card>

            <Card>
              <h3>Calendrier</h3>
              <Inline
                justify="between"
                gap="sm"
                className="text-sm font-normal"
              >
                <Stack gap="none">
                  <span className="text-grey-8">Début</span>
                  <span className="font-bold text-primary-10">
                    {calendrier.debut}
                  </span>
                </Stack>
                <Stack gap="none" className="text-right">
                  <span className="text-grey-8">Fin prévue</span>
                  <span className="font-bold text-primary-10">
                    31 déc. 2028
                  </span>
                </Stack>
              </Inline>
              <ProgressBar
                value={calendrier.tempsEcoule}
                label="Temps écoulé : 54 %"
                tone="dark"
              />
              <span className="text-xs font-normal text-grey-8">
                54 % du temps écoulé · 62 % d'avancement
              </span>
            </Card>

            <Card>
              <h3>Financement</h3>
              <AmountList
                lignes={financements}
                totalLibelle="Budget prévisionnel"
                total={budgetPrevisionnel}
              />
            </Card>

            <Card>
              <h3>Référentiels</h3>
              <Stack gap="sm" className="text-sm font-normal">
                {referentiels.map((referentiel) => (
                  <a
                    key={referentiel}
                    href="#"
                    className="text-primary-7 hover:text-primary-8"
                  >
                    {referentiel}
                  </a>
                ))}
              </Stack>
            </Card>

            <Card>
              <h3>Activité récente</h3>
              <ActivityList activites={activites} />
              <Button variant="link" size="sm">
                Voir tout l'historique
              </Button>
            </Card>
          </>
        }
      />
    </Stack>
  );
}
