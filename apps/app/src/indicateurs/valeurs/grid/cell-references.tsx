'use client';

import { appLabels } from '@/app/labels/catalog';
import { Tooltip } from '@tet/ui';
import { JSX } from 'react';
import { GridCellReference } from './types';

/** Deux façons de présenter les constats extérieurs d'une cellule. */
export type ReferencesVariant = 'list' | 'compact';

const withResultat = (references: GridCellReference[]): GridCellReference[] =>
  references.filter((reference) => reference.resultat !== null);

const referenceKey = (reference: GridCellReference): string =>
  `${reference.label}:${reference.millesime ?? ''}`;

/**
 * Constats des sources extérieures sous la saisie de la collectivité. Ils
 * renseignent sans rien remplir : la valeur qui compte reste celle du champ.
 */
export const CellReferences = ({
  references,
}: {
  references: GridCellReference[];
}): JSX.Element | null => {
  const rows = withResultat(references);
  if (rows.length === 0) {
    return null;
  }

  return (
    <ul className="mt-0.5 flex flex-col gap-0.5">
      {rows.map((reference) => (
        <li
          key={referenceKey(reference)}
          className="flex items-baseline gap-1 text-xs leading-tight text-grey-7"
        >
          <Tooltip
            label={appLabels.indicateurValeurReference({
              source: reference.label,
              millesime: reference.millesime,
            })}
          >
            <span className="shrink-0 font-medium">{reference.label}</span>
          </Tooltip>
          <span className="tabular-nums">{reference.resultat}</span>
        </li>
      ))}
    </ul>
  );
};

const ReferenceLines = ({
  references,
}: {
  references: GridCellReference[];
}): JSX.Element => (
  <div className="flex flex-col gap-1">
    <span className="font-bold">{appLabels.indicateurValeursReferenceTitre}</span>
    <ul className="flex flex-col gap-0.5">
      {references.map((reference) => (
        <li key={referenceKey(reference)}>
          {appLabels.indicateurValeurReferenceLigne({
            source: reference.label,
            millesime: reference.millesime,
            valeur: String(reference.resultat),
          })}
        </li>
      ))}
    </ul>
  </div>
);

/**
 * Variante compacte : un coin replié en haut à droite de la cellule, sur le
 * modèle des remarques d'un tableur. Elle ne coûte aucune hauteur, là où la
 * liste ajoute une ligne par source à chacune des lignes du topic.
 *
 * Le marqueur est un vrai bouton, et pas seulement un décor au survol : les
 * cellules de cette grille ne sont pas atteignables au clavier en lecture
 * seule, il faut donc que le constat ait son propre point de focus. L'info-bulle
 * du design system s'ouvre au survol comme au focus et porte `role="tooltip"`,
 * ce qui la rend annonçable par un lecteur d'écran.
 */
export const CellReferenceMarker = ({
  references,
}: {
  references: GridCellReference[];
}): JSX.Element | null => {
  const rows = withResultat(references);
  if (rows.length === 0) {
    return null;
  }

  return (
    <Tooltip label={<ReferenceLines references={rows} />} placement="top-end">
      <button
        type="button"
        data-test="indicateurs.valeurs.cell-reference-marker"
        aria-label={appLabels.indicateurValeursReferenceMarqueur({
          count: rows.length,
        })}
        // La cible cliquable fait 16px pour rester atteignable, le repère
        // visuel 7px pour ne pas empiéter sur la valeur.
        className="absolute right-0 top-0 flex size-4 items-start justify-end rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
      >
        <span
          aria-hidden
          className="size-0 border-l-[7px] border-t-[7px] border-l-transparent border-t-primary-7"
        />
      </button>
    </Tooltip>
  );
};
