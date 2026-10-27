'use client';

import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Grid,
  Icon,
  IconValue,
  Inline,
  PageHeader,
  Stack,
} from '@tet/ui';
import { ReactNode } from 'react';
import { Fiche, fiches, PrioriteFiche, StatutFiche } from './fixtures';
import { BudgetFlamme } from './proposals/budget-flamme';

const statutVariant = {
  'En cours': 'info',
  'En retard': 'error',
  Réalisé: 'success',
} as const satisfies Record<StatutFiche, string>;

const prioriteVariant = {
  'Priorité élevée': 'high',
  'Priorité moyenne': 'standard',
  'Priorité basse': 'grey',
} as const satisfies Record<PrioriteFiche, string>;

const euros = (montant: number): string =>
  `${montant.toLocaleString('fr-FR')} €`;

const SEUIL_BUDGET_ELEVE = 450_000;

const estBudgetEleve = (montant: number): boolean =>
  montant > SEUIL_BUDGET_ELEVE;

const indicateursLabel = (nombre: number): string =>
  `${nombre} ${nombre > 1 ? 'liés' : 'lié'}`;

const sousActionsLabel = ({ realisees, total }: Fiche['sousActions']): string =>
  `${realisees} / ${total} sous-actions réalisées`;

const estTerminee = ({ realisees, total }: Fiche['sousActions']): boolean =>
  realisees === total;

const Label = ({ children }: { children: ReactNode }) => (
  <span className="text-xs text-grey-8">{children}</span>
);

const IconValueRow = ({
  icon,
  children,
}: {
  icon: IconValue;
  children: ReactNode;
}) => (
  <Inline gap="sm" align="center" wrap={false}>
    <Icon icon={icon} size="sm" className="text-primary-7" aria-hidden="true" />
    {children}
  </Inline>
);

const CardField = ({
  label,
  icon,
  children,
}: {
  label: string;
  icon: IconValue;
  children: ReactNode;
}) => (
  <Stack gap="xs">
    <Label>{label}</Label>
    <IconValueRow icon={icon}>{children}</IconValueRow>
  </Stack>
);

const FicheCard = ({ fiche }: { fiche: Fiche }) => (
  <Card className="h-full">
    <Stack gap="md">
      <Inline justify="between" align="center" wrap={false}>
        <Inline gap="xs" align="center">
          <Badge
            title={fiche.statut}
            variant={statutVariant[fiche.statut]}
            type="solid"
            size="sm"
          />
          <Badge
            title={fiche.priorite}
            variant={prioriteVariant[fiche.priorite]}
            type="outlined"
            size="sm"
          />
        </Inline>
        <Inline gap="xs" align="center" wrap={false}>
          {fiche.estPrivee && (
            <Icon
              icon="lock-line"
              size="sm"
              className="text-grey-8"
              role="img"
              aria-label="Fiche privée"
            />
          )}
          <Button
            variant="grey"
            size="xs"
            icon="more-2-line"
            aria-label="Actions de la fiche"
          />
        </Inline>
      </Inline>

      <Stack gap="xs">
        <Label>{fiche.plan}</Label>
        <h6 className="line-clamp-2 mb-0">{fiche.titre}</h6>
      </Stack>

      <Stack gap="xs">
        <Label>Avancement</Label>
        <IconValueRow
          icon={
            estTerminee(fiche.sousActions)
              ? 'checkbox-circle-fill'
              : 'checkbox-circle-line'
          }
        >
          <span className="paragraphe-14">
            {sousActionsLabel(fiche.sousActions)}
          </span>
        </IconValueRow>
      </Stack>

      <Divider />

      <Grid columns={2} gap="md">
        <CardField label="Pilote" icon="user-line">
          <span className="paragraphe-14 truncate">{fiche.pilote}</span>
        </CardField>
        <CardField
          label="Échéance"
          icon={fiche.enRetard ? 'calendar-close-line' : 'calendar-line'}
        >
          <span
            className={
              fiche.enRetard ? 'paragraphe-14 font-bold' : 'paragraphe-14'
            }
          >
            {fiche.echeance}
          </span>
        </CardField>
        <CardField label="Budget prévisionnel" icon="money-euro-circle-line">
          <span className="paragraphe-14">
            {euros(fiche.budgetPrevisionnel)}
          </span>
          {estBudgetEleve(fiche.budgetPrevisionnel) && (
            <BudgetFlamme seuil={euros(SEUIL_BUDGET_ELEVE)} />
          )}
        </CardField>
        <CardField label="Indicateurs" icon="line-chart-line">
          <span className="paragraphe-14">
            {indicateursLabel(fiche.indicateursLies)}
          </span>
        </CardField>
      </Grid>

      <Inline justify="between" align="center">
        <Inline gap="xs" align="center">
          {fiche.etiquettes.map((etiquette) => (
            <Badge key={etiquette} title={etiquette} variant="info" size="sm" />
          ))}
        </Inline>
        <Label>Modifiée le {fiche.modifieeLe}</Label>
      </Inline>
    </Stack>
  </Card>
);

export default function CardPage() {
  return (
    <Stack gap="lg">
      <PageHeader>
        <PageHeader.Title>Carte fiche action</PageHeader.Title>
      </PageHeader>

      <Grid
        as="ul"
        columns={{ base: 1, md: 2, lg: 3 }}
        gap="lg"
        className="mb-0"
      >
        {fiches.map((fiche) => (
          <Box as="li" key={fiche.id}>
            <FicheCard fiche={fiche} />
          </Box>
        ))}
      </Grid>
    </Stack>
  );
}
