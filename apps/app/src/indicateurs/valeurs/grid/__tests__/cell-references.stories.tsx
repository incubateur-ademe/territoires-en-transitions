import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { JSX } from 'react';
import type { ReferencesVariant } from '../cell-references';
import { IndicateurValeursTable } from '../indicateur-valeurs.table';
import {
  generateCellKey,
  toIndicateurId,
  toYear,
  type CellKey,
  type GridCell,
  type GridRow,
  type Year,
} from '../types';
import { fakeGridActions } from './grid-fixtures';

/**
 * Deux présentations des constats des sources extérieures, sur la matière réelle
 * du profil énergie climat d'un EPCI : l'inventaire RARE-OREC en kteq CO2, avec
 * l'Atmo en second constat sur une ligne pour montrer le cas à deux sources.
 */
const meta: Meta<typeof IndicateurValeursTable> = {
  title: 'Indicateurs/Grille de saisie/Constats des sources',
  component: IndicateurValeursTable,
};

export default meta;

type Story = StoryObj<typeof IndicateurValeursTable>;

const REFERENCE_YEAR: Year = toYear(2018);
const YEARS: Year[] = [2018, 2019, 2030, 2036, 2050].map(toYear);

const MILLESIME_RARE = '2024-07-18';

/** Secteur, saisie de la collectivité sur 2018, et inventaires 2018 / 2019. */
const SECTEURS = [
  { label: 'Résidentiel', saisie: 27.42, rare2018: 27.42, rare2019: 27.13 },
  { label: 'Tertiaire', saisie: 10.51, rare2018: 10.51, rare2019: 10.34 },
  { label: 'Transport routier', saisie: 32.98, rare2018: 32.98, rare2019: 33.4 },
  { label: 'Agriculture', saisie: 127.2, rare2018: 127.2, rare2019: 126.84 },
  // Saisie divergente de l'inventaire : c'est le cas que l'affichage doit
  // rendre visible.
  { label: 'Déchets', saisie: 2.1, rare2018: 1.38, rare2019: 1.41 },
  // Aucun constat : la cellule doit rester nue, sans marqueur.
  { label: 'Branche énergie', saisie: 0.17, rare2018: null, rare2019: null },
] as const;

const rows: GridRow[] = SECTEURS.map((secteur, index) => ({
  indicateurId: toIndicateurId(100 + index),
  label: secteur.label,
}));

const buildCells = (): Map<CellKey, GridCell> => {
  const cells = new Map<CellKey, GridCell>();

  SECTEURS.forEach((secteur, index) => {
    const indicateurId = toIndicateurId(100 + index);

    const references = (resultat: number | null) =>
      resultat === null
        ? []
        : [{ label: 'RARE-OREC', millesime: MILLESIME_RARE, resultat }];

    cells.set(generateCellKey(indicateurId, toYear(2018)), {
      resultat: secteur.saisie,
      objectif: null,
      // Le résidentiel porte deux constats, pour vérifier l'empilement.
      references:
        secteur.label === 'Résidentiel'
          ? [
              ...references(secteur.rare2018),
              { label: 'Atmo', millesime: '2025-12-31', resultat: 26.9 },
            ]
          : references(secteur.rare2018),
    });

    cells.set(generateCellKey(indicateurId, toYear(2019)), {
      resultat: null,
      objectif: null,
      references: references(secteur.rare2019),
    });

    [
      { year: 2030, facteur: 0.8 },
      { year: 2036, facteur: 0.65 },
      { year: 2050, facteur: 0.45 },
    ].forEach(({ year, facteur }) => {
      cells.set(generateCellKey(indicateurId, toYear(year)), {
        resultat: null,
        objectif: Math.round(secteur.saisie * facteur * 100) / 100,
        references: [],
      });
    });
  });

  return cells;
};

const Grille = ({
  variant,
}: {
  variant: ReferencesVariant;
}): JSX.Element => (
  <IndicateurValeursTable
    rows={rows}
    years={YEARS}
    referenceYear={REFERENCE_YEAR}
    title="Secteur"
    unit="kteq CO2"
    cells={buildCells()}
    isReadonly
    maxHeight="none"
    referencesVariant={variant}
    actions={fakeGridActions}
    notify={(message) => window.alert(message)}
  />
);

const Section = ({
  titre,
  description,
  children,
}: {
  titre: string;
  description: string;
  children: JSX.Element;
}): JSX.Element => (
  <section className="flex flex-col gap-2">
    <h2 className="text-lg font-bold text-primary-9">{titre}</h2>
    <p className="max-w-3xl text-sm text-grey-8">{description}</p>
    {children}
  </section>
);

/** Les deux présentations l'une sous l'autre, pour comparer la hauteur. */
export const Comparaison: Story = {
  render: () => (
    <div className="flex flex-col gap-10">
      <Section
        titre="Compacte — un coin replié"
        description="Le coin en haut à droite signale un constat extérieur, sur le modèle des remarques d’un tableur. Aucune hauteur ajoutée. Survolez le coin, ou atteignez-le au clavier avec Tab : l’info-bulle liste chaque source, son millésime et sa valeur. Le marqueur est un bouton, donc annonçable par un lecteur d’écran — les cellules de cette grille ne sont pas focusables en lecture seule."
      >
        <Grille variant="compact" />
      </Section>

      <Section
        titre="Liste — une ligne par source sous la valeur"
        description="Tout est lisible sans interaction, mais chaque source ajoute une ligne sous la valeur : sur ces six secteurs du profil énergie climat, la grille double déjà de hauteur."
      >
        <Grille variant="list" />
      </Section>
    </div>
  ),
};

export const Compacte: Story = {
  render: () => <Grille variant="compact" />,
};

export const Liste: Story = {
  render: () => <Grille variant="list" />,
};
