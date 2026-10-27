'use client';

import { Badge, Box, Button, Grid, Inline, PageHeader, Stack } from '@tet/ui';

/*
 * Prototype de référence. Tout le layout passe par les primitives (`Stack`,
 * `Inline`, `Grid`, `Box`) : la composition peut être reprise telle quelle
 * dans `apps/app`. Les données sont en dur, typées localement.
 */

type PlanFixture = Readonly<{
  id: number;
  nom: string;
  type: string;
  nbFiches: number;
  avancement: 'À venir' | 'En cours' | 'Réalisé';
}>;

const plans: ReadonlyArray<PlanFixture> = [
  {
    id: 1,
    nom: 'Plan climat air énergie territorial',
    type: 'PCAET',
    nbFiches: 42,
    avancement: 'En cours',
  },
  {
    id: 2,
    nom: 'Plan de mobilité simplifié',
    type: 'Mobilité',
    nbFiches: 12,
    avancement: 'À venir',
  },
  {
    id: 3,
    nom: 'Programme alimentaire territorial',
    type: 'PAT',
    nbFiches: 18,
    avancement: 'Réalisé',
  },
];

const badgeVariant = {
  'À venir': 'grey',
  'En cours': 'info',
  Réalisé: 'success',
} as const;

export default function ExempleListePlansPage() {
  return (
    <Stack gap="lg">
      <PageHeader>
        <PageHeader.Title>Plans d’action</PageHeader.Title>
        <PageHeader.Actions>
          <Button size="sm" icon="add-line">
            Créer un plan
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      <Grid as="ul" columns={{ base: 1, md: 2, lg: 3 }}>
        {plans.map((plan) => (
          <Box
            as="li"
            key={plan.id}
            padding="lg"
            className="rounded-lg border border-grey-3 bg-white"
          >
            <Stack gap="sm">
              <Inline justify="between" align="center">
                <Badge title={plan.type} variant="standard" size="sm" />
                <Badge
                  title={plan.avancement}
                  variant={badgeVariant[plan.avancement]}
                  size="sm"
                />
              </Inline>
              <h3 className="mb-0 text-lg text-primary-9">{plan.nom}</h3>
              <span className="text-sm text-grey-8">
                {plan.nbFiches} fiches action
              </span>
            </Stack>
          </Box>
        ))}
      </Grid>
    </Stack>
  );
}
