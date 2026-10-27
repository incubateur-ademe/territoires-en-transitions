'use client';

import { Badge, Box, Button, Inline, PageHeader, Stack } from '@tet/ui';
import { FicheBudget, fiches, indicateurs } from './fixtures';
import { ProgressBar } from './proposals/progress-bar';
import { StatCard } from './proposals/stat-card';
import { StatRow } from './proposals/stat-row';

const euros = (montant: number): string =>
  `${montant.toLocaleString('fr-FR')} €`;

const badgeVariant = {
  'En cours': 'info',
  'À venir': 'grey',
  Réalisé: 'success',
} as const satisfies Record<FicheBudget['statut'], string>;

export default function FichesBudgetPage() {
  return (
    <Stack gap="lg">
      <PageHeader>
        <PageHeader.Title>Budget des fiches action</PageHeader.Title>
        <PageHeader.Actions>
          <Button variant="outlined" size="sm" icon="download-line">
            Exporter
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      <StatRow>
        {indicateurs.map(({ label, valeur, unite }) => (
          <StatCard
            key={label}
            label={label}
            value={unite === 'euros' ? euros(valeur) : String(valeur)}
          />
        ))}
      </StatRow>

      <Stack as="ul" gap="sm">
        {fiches.map((fiche) => (
          <Box
            as="li"
            key={fiche.nom}
            padding="md"
            className="rounded-lg border border-grey-3"
          >
            <Inline justify="between" align="center" gap="md">
              <Stack gap="none">
                <span className="font-bold text-primary-9">{fiche.nom}</span>
                <span className="text-sm text-grey-8">{fiche.pilote}</span>
              </Stack>
              <Inline align="center" gap="md">
                <span className="text-sm">{euros(fiche.budget)}</span>
                <ProgressBar
                  value={fiche.consomme}
                  label={`Budget consommé : ${Math.round(
                    fiche.consomme * 100
                  )} %`}
                />
                <Badge
                  title={fiche.statut}
                  variant={badgeVariant[fiche.statut]}
                  size="sm"
                />
              </Inline>
            </Inline>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
