import { appLabels } from '@/app/labels/catalog';
import {
  cn,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { useState } from 'react';
import {
  getAnneeOuverteInitiale,
  GroupeAnnee,
  groupLignesByAnnee,
  LigneValeur,
  partitionGroupesByAnneeReference,
} from './group-lignes-by-annee.utils';
import {
  GroupeAnneeRows,
  LigneRowProps,
} from './subaction.indicateur-modal-resultats.rows';

type Props = LigneRowProps & {
  lignes: LigneValeur[];
  /** Année en deçà de laquelle les résultats ne sont pas listés, si le calcul du score en a une */
  anneeReference?: number | null;
  /** Des résultats existent mais sont écartés car antérieurs à l'année de référence */
  hasResultatsAnterieursMasques?: boolean;
  /** Grise la liste et empêche toute sélection, ex. quand l'indicateur est déclaré non suivi */
  disabled?: boolean;
};

export const IndicateurResultatsTable = ({
  lignes,
  anneeReference = null,
  hasResultatsAnterieursMasques = false,
  disabled = false,
  ...rowProps
}: Props) => {
  const { selectionneeId } = rowProps;
  const groupesParAnnee = groupLignesByAnnee(lignes);

  // Ouvre par défaut la sous-liste contenant la valeur sélectionnée. Calculé
  // une seule fois, au montage : les bascules manuelles de l'utilisateur ne
  // doivent pas être écrasées par la suite.
  const [anneesOuvertes, setAnneesOuvertes] = useState(() => {
    const annee = getAnneeOuverteInitiale(groupesParAnnee, selectionneeId);
    return new Set(annee === null ? [] : [annee]);
  });

  const toggleAnneeOuverte = (annee: number) => {
    setAnneesOuvertes((anneesPrecedentes) => {
      const nouvellesAnnees = new Set(anneesPrecedentes);
      if (nouvellesAnnees.has(annee)) {
        nouvellesAnnees.delete(annee);
      } else {
        nouvellesAnnees.add(annee);
      }
      return nouvellesAnnees;
    });
  };

  const resultatsAnterieursMessage =
    anneeReference === null
      ? null
      : appLabels.scoreIndicatifResultatsAnterieursNonPrisEnCompte(
          anneeReference
        );

  if (lignes.length === 0) {
    return (
      <div className="py-4 text-sm text-neutral-600">
        {hasResultatsAnterieursMasques && resultatsAnterieursMessage
          ? resultatsAnterieursMessage
          : appLabels.aucunResultatIndicateurDisponible}
      </div>
    );
  }

  const ligneSelectionnee = lignes.find((ligne) => ligne.id === selectionneeId);

  // une valeur antérieure à l'année de référence n'est listée que si elle est
  // déjà sélectionnée : elle est alors affichée sous le message
  const [groupesAffichables, groupesAnterieurs] =
    partitionGroupesByAnneeReference(groupesParAnnee, anneeReference);

  const renderGroupe = (groupe: GroupeAnnee) => (
    <GroupeAnneeRows
      key={groupe.annee}
      groupe={groupe}
      ouverte={anneesOuvertes.has(groupe.annee)}
      onToggle={() => toggleAnneeOuverte(groupe.annee)}
      {...rowProps}
    />
  );

  return (
    // `inert` retire aussi les lignes du parcours clavier, ce que
    // `pointer-events-none` seul ne fait pas
    <div
      className={cn(disabled && 'opacity-50 pointer-events-none')}
      inert={disabled}
    >
      <p
        className={cn(
          'text-sm mb-2',
          ligneSelectionnee ? 'text-primary-9' : 'text-grey-8'
        )}
      >
        {ligneSelectionnee
          ? appLabels.sourceResultatSelectionne(
              ligneSelectionnee.source,
              ligneSelectionnee.annee
            )
          : appLabels.selectionnerResultatPourCalculerScore}
      </p>
      <div className="max-h-[340px] overflow-y-auto border border-neutral-300 rounded">
        <Table className="text-sm">
          <TableHead>
            <TableRow className="text-grey-8">
              <TableHeaderCell title={appLabels.annee} />
              <TableHeaderCell title={appLabels.source} />
              <TableHeaderCell
                title={capitalize(appLabels.indicateurResultat())}
                align="right"
              />
              <TableHeaderCell className="w-8" />
            </TableRow>
          </TableHead>
          <tbody>
            {groupesAffichables.map(renderGroupe)}
            {resultatsAnterieursMessage && (
              <TableRow>
                <TableCell colSpan={4} className="py-2 text-grey-7">
                  {resultatsAnterieursMessage}
                </TableCell>
              </TableRow>
            )}
            {groupesAnterieurs.map(renderGroupe)}
          </tbody>
        </Table>
      </div>
    </div>
  );
};
