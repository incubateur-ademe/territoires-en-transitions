'use client';

import {
  Badge,
  Button,
  Inline,
  InlineLink,
  PageHeader,
  PillButton,
  Stack,
  Table,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tet/ui';
import { useState } from 'react';
import {
  Fiche,
  fiches as fichesInitiales,
  plan,
  Statut,
  statuts,
} from './fixtures';
import { EnvironmentBanner } from './proposals/environment-banner';
import { TableScrollFrame } from './proposals/table-scroll-frame';
import { TableTotalRow } from './proposals/table-total-row';

type Filtre = Statut | 'Tous';

const euros = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const formatMontant = (montant: number | null): string =>
  montant === null ? 'Non renseigné' : euros.format(montant);

const pluralFiches = (nombre: number): string =>
  `${nombre} fiche${nombre > 1 ? 's' : ''}`;

const sommeDe =
  (cle: 'budgetPrevisionnel' | 'depense') =>
  (liste: ReadonlyArray<Fiche>): number =>
    liste.reduce((total, fiche) => total + (fiche[cle] ?? 0), 0);

const totalBudget = sommeDe('budgetPrevisionnel');
const totalDepense = sommeDe('depense');

const filtrerParStatut = (
  liste: ReadonlyArray<Fiche>,
  filtre: Filtre
): ReadonlyArray<Fiche> =>
  filtre === 'Tous' ? liste : liste.filter((fiche) => fiche.statut === filtre);

const badgeVariant = {
  'À venir': 'grey',
  'En cours': 'info',
  Réalisé: 'success',
  'En retard': 'error',
  'En pause': 'warning',
  Abandonné: 'default',
} as const satisfies Record<Statut, string>;

const filtres: ReadonlyArray<Filtre> = ['Tous', ...statuts];

const colonnes = [
  { id: 'titre', titre: 'Fiche action' },
  { id: 'statut', titre: 'Statut', className: 'w-32' },
  { id: 'pilote', titre: 'Pilote', className: 'w-52' },
  {
    id: 'budget',
    titre: 'Budget prévisionnel',
    className: 'w-44',
    align: 'right',
  },
  { id: 'depense', titre: 'Dépensé', className: 'w-36', align: 'right' },
  { id: 'fin', titre: 'Fin prévue', className: 'w-28' },
] as const;

const nouvelleFiche = (rang: number): Fiche => ({
  titre: rang === 1 ? 'Nouvelle fiche' : `Nouvelle fiche ${rang}`,
  statut: 'À venir',
  pilote: 'Non renseigné',
  budgetPrevisionnel: null,
  depense: null,
  finPrevue: null,
});

export default function FichesPlanPage() {
  const [filtre, setFiltre] = useState<Filtre>('Tous');
  const [nbAjoutees, setNbAjoutees] = useState(0);

  const fiches: ReadonlyArray<Fiche> = [
    ...Array.from({ length: nbAjoutees }, (_, index) =>
      nouvelleFiche(index + 1)
    ),
    ...fichesInitiales,
  ];
  const visibles = filtrerParStatut(fiches, filtre);
  const budgetVisible = euros.format(totalBudget(visibles));

  const ajouterFiche = () => {
    setNbAjoutees((nb) => nb + 1);
    setFiltre('Tous');
  };

  return (
    <Stack gap="lg">
      <EnvironmentBanner
        message="En cours de développement"
        variant="warning"
      />

      <PageHeader>
        <PageHeader.Title>{plan.nom}</PageHeader.Title>
        <PageHeader.Actions>
          <Button
            variant="primary"
            size="sm"
            icon="add-line"
            onClick={ajouterFiche}
          >
            Ajouter une fiche
          </Button>
        </PageHeader.Actions>
        <PageHeader.Subtitle>
          {`${pluralFiches(
            fiches.length
          )} · Budget prévisionnel total : ${euros.format(
            totalBudget(fiches)
          )}`}
        </PageHeader.Subtitle>
      </PageHeader>

      <Inline gap="md" justify="between" align="center" collapseBelow="md">
        <Inline gap="sm" role="group" aria-label="Filtrer par statut">
          {filtres.map((statut) => (
            <PillButton
              key={statut}
              isActive={statut === filtre}
              onClick={() => setFiltre(statut)}
            >
              {`${statut} (${filtrerParStatut(fiches, statut).length})`}
            </PillButton>
          ))}
        </Inline>
        <p className="paragraphe-14 mb-0 text-grey-8">
          Budget prévisionnel affiché :{' '}
          <strong className="text-primary-9">{budgetVisible}</strong>
        </p>
      </Inline>

      <TableScrollFrame>
        <Table aria-label="Fiches action du plan, filtrées par statut">
          <TableHead>
            <tr>
              {colonnes.map((colonne) => (
                <TableHeaderCell
                  key={colonne.id}
                  title={colonne.titre}
                  className={
                    'className' in colonne ? colonne.className : undefined
                  }
                  align={'align' in colonne ? colonne.align : 'left'}
                />
              ))}
            </tr>
          </TableHead>
          <tbody>
            {visibles.length === 0 ? (
              <TableEmpty
                columnIds={colonnes.map((colonne) => colonne.id)}
                title="Aucune fiche pour ce statut"
                subTitle="Choisissez un autre statut ou ajoutez une fiche au plan."
                actions={[
                  {
                    children: 'Afficher toutes les fiches',
                    variant: 'outlined',
                    onClick: () => setFiltre('Tous'),
                  },
                ]}
              />
            ) : (
              visibles.map((fiche, index) => (
                <TableRow key={`${fiche.titre}-${index}`} className="text-sm">
                  <TableCell>
                    <InlineLink href="#" className="font-medium">
                      {fiche.titre}
                    </InlineLink>
                  </TableCell>
                  <TableCell>
                    <Badge
                      title={fiche.statut}
                      variant={badgeVariant[fiche.statut]}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell>{fiche.pilote}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMontant(fiche.budgetPrevisionnel)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-grey-8">
                    {formatMontant(fiche.depense)}
                  </TableCell>
                  <TableCell>{fiche.finPrevue ?? '—'}</TableCell>
                </TableRow>
              ))
            )}
          </tbody>
          {visibles.length > 0 && (
            <TableTotalRow
              label={`Total (${pluralFiches(visibles.length)})`}
              labelColSpan={3}
              values={[budgetVisible, euros.format(totalDepense(visibles))]}
              trailingColSpan={1}
            />
          )}
        </Table>
      </TableScrollFrame>
    </Stack>
  );
}
