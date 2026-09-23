import { appLabels } from '@/app/labels/catalog';
import {
  cn,
  Icon,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { Fragment, useState } from 'react';

export type LigneValeur = {
  id: number;
  annee: number;
  valeur: number;
  source: string;
};

type Props = {
  lignes: LigneValeur[];
  unite: string;
  selectionneeId: number | null;
  isPending: boolean;
  /** Grise la liste et empêche toute sélection, ex. quand l'indicateur est déclaré non suivi */
  disabled?: boolean;
  onSelect: (indicateurValeurId: number | null) => void;
};

const rowClassName = (selectionnee: boolean) =>
  cn('py-2 hover:bg-primary-1 cursor-pointer', {
    '!bg-primary-2': selectionnee,
  });

/** Cellule contenant la valeur d'un résultat */
const ValeurCell = ({
  valeur,
  unite,
  emphase,
}: {
  valeur: number;
  unite: string;
  emphase?: boolean;
}) => (
  <TableCell className="py-2 text-right">
    <span
      className={cn('text-primary-9 text-lg', emphase ? 'font-semibold' : 'font-medium')}
    >
      {valeur}
    </span>{' '}
    <span className="text-neutral-700">{unite}</span>
  </TableCell>
);

/** Cellule contenant le picto représentant la ligne sélectionnée */
const SelectionCell = ({ selectionnee }: { selectionnee: boolean }) => (
  <TableCell className="py-2 pl-2 text-right">
    {selectionnee && <Icon icon="check-line" />}
  </TableCell>
);

/** Ligne représentant une valeur d'indicateur, seule pour une année ou repliée sous un groupe d'années. */
const IndicateurValeurRow = ({
  ligne,
  unite,
  selectionneeId,
  isPending,
  onSelect,
  indentee = false,
}: {
  ligne: LigneValeur;
  unite: string;
  selectionneeId: number | null;
  isPending: boolean;
  onSelect: (indicateurValeurId: number | null) => void;
  indentee?: boolean;
}) => {
  const estSelectionnee = ligne.id === selectionneeId;

  const handleClick = () => {
    if (isPending) return;
    onSelect(estSelectionnee ? null : ligne.id);
  };

  return (
    <TableRow
      className={rowClassName(estSelectionnee)}
      onClick={handleClick}
    >
      {indentee ? (
        <TableCell />
      ) : (
        <TableCell className="font-bold text-neutral-700">
          {ligne.annee}
        </TableCell>
      )}
      <TableCell className={cn('py-2 text-neutral-600', indentee && 'pl-4')}>
        {ligne.source}
      </TableCell>
      <ValeurCell valeur={ligne.valeur} unite={unite} emphase={indentee} />
      <SelectionCell selectionnee={estSelectionnee} />
    </TableRow>
  );
};

/** En-tête d'un groupe d'années regroupant plusieurs sources, dépliable. */
const AnneeGroupeRow = ({
  annee,
  nombreSources,
  ouverte,
  onToggle,
}: {
  annee: number;
  nombreSources: number;
  ouverte: boolean;
  onToggle: () => void;
}) => (
  <TableRow className="py-2 hover:bg-primary-1 cursor-pointer" onClick={onToggle}>
    <TableCell className="font-bold text-neutral-700">{annee}</TableCell>
    <TableCell className="py-2">
      {appLabels.sources({ count: nombreSources })}
    </TableCell>
    <TableCell className="py-2 text-right" />
    <TableCell className="py-2 pl-2 text-right">
      <Icon icon={ouverte ? 'arrow-up-s-line' : 'arrow-down-s-line'} />
    </TableCell>
  </TableRow>
);

/** En-tête dépliable d'un groupe d'années, suivi de ses lignes de valeurs si déplié. */
const AnneeGroupeRows = ({
  groupe,
  unite,
  selectionneeId,
  isPending,
  onSelect,
  ouverte,
  onToggle,
}: {
  groupe: { annee: number; lignes: LigneValeur[] };
  unite: string;
  selectionneeId: number | null;
  isPending: boolean;
  onSelect: (indicateurValeurId: number | null) => void;
  ouverte: boolean;
  onToggle: () => void;
}) => (
  <Fragment>
    <AnneeGroupeRow
      annee={groupe.annee}
      nombreSources={groupe.lignes.length}
      ouverte={ouverte}
      onToggle={onToggle}
    />
    {ouverte &&
      groupe.lignes.map((ligne) => (
        <IndicateurValeurRow
          key={ligne.id}
          ligne={ligne}
          unite={unite}
          selectionneeId={selectionneeId}
          isPending={isPending}
          onSelect={onSelect}
          indentee
        />
      ))}
  </Fragment>
);

export const IndicateurResultatsTable = ({
  lignes,
  unite,
  selectionneeId,
  isPending,
  disabled = false,
  onSelect,
}: Props) => {
  const [anneesOuvertes, setAnneesOuvertes] = useState<Set<number>>(new Set());
  const [ouvertureInitialeAppliquee, setOuvertureInitialeAppliquee] =
    useState(false);

  const groupesParAnnee = lignes.reduce<
    { annee: number; lignes: LigneValeur[] }[]
  >((groupes, ligne) => {
    const dernierGroupe = groupes[groupes.length - 1];
    if (dernierGroupe && dernierGroupe.annee === ligne.annee) {
      dernierGroupe.lignes.push(ligne);
    } else {
      groupes.push({ annee: ligne.annee, lignes: [ligne] });
    }
    return groupes;
  }, []);

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

  // Une fois les lignes chargées, ouvre par défaut la sous-liste contenant
  // la valeur sélectionnée courante. N'agit qu'une seule fois : les bascules
  // manuelles de l'utilisateur ne doivent pas être écrasées par la suite.
  if (!ouvertureInitialeAppliquee && lignes.length > 0) {
    setOuvertureInitialeAppliquee(true);
    const groupeSelectionne = groupesParAnnee.find((groupe) =>
      groupe.lignes.some((ligne) => ligne.id === selectionneeId)
    );
    if (groupeSelectionne && groupeSelectionne.lignes.length > 1) {
      setAnneesOuvertes(new Set([groupeSelectionne.annee]));
    }
  }

  if (lignes.length === 0) {
    return (
      <div className="py-4 text-sm text-neutral-600">
        {appLabels.aucunResultatIndicateurDisponible}
      </div>
    );
  }

  const ligneSelectionnee = lignes.find((ligne) => ligne.id === selectionneeId);

  return (
    <div className={cn(disabled && 'opacity-50 pointer-events-none')}>
      <p className={cn("text-sm  mb-2", {
        'text-grey-8': !ligneSelectionnee,
        'text-primary-9': ligneSelectionnee
      })}>
        {ligneSelectionnee
          ? appLabels.sourceResultatSelectionne(
              ligneSelectionnee.source,
              ligneSelectionnee.annee
            )
          : appLabels.selectionnerResultatPourCalculerScore}
      </p>
      <div className="max-h-64 overflow-y-auto border border-neutral-300 rounded">
        <Table className="text-sm">
          <TableHead>
            <TableRow className="text-grey-8">
              <TableHeaderCell
                title={appLabels.annee}
              />
              <TableHeaderCell
                title={appLabels.source}
              />
              <TableHeaderCell
                title={capitalize(appLabels.indicateurResultat())}
                align="right"
              />
              <TableHeaderCell className="w-8" />
            </TableRow>
          </TableHead>
          <tbody>
            {groupesParAnnee.map((groupe) => {
              if (groupe.lignes.length === 1) {
                return (
                  <IndicateurValeurRow
                    key={groupe.lignes[0].id}
                    ligne={groupe.lignes[0]}
                    unite={unite}
                    selectionneeId={selectionneeId}
                    isPending={isPending}
                    onSelect={onSelect}
                  />
                );
              }

              return (
                <AnneeGroupeRows
                  key={groupe.annee}
                  groupe={groupe}
                  unite={unite}
                  selectionneeId={selectionneeId}
                  isPending={isPending}
                  onSelect={onSelect}
                  ouverte={anneesOuvertes.has(groupe.annee)}
                  onToggle={() => toggleAnneeOuverte(groupe.annee)}
                />
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
};
