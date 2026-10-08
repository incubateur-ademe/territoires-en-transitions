import { appLabels } from '@/app/labels/catalog';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { cn, Icon, TableCell, TableRow } from '@tet/ui';
import { ComponentProps, KeyboardEvent } from 'react';
import { GroupeAnnee, LigneValeur } from './group-lignes-by-annee.utils';

/** Props communes à toutes les lignes sélectionnables */
export type LigneRowProps = {
  unite: string;
  selectionneeId: number | null;
  isPending: boolean;
  onSelect: (indicateurValeurId: number | null) => void;
};

/**
 * Ligne activable à la souris comme au clavier : elle prend le focus et
 * réagit aux touches Entrée et Espace.
 */
const ClickableRow = ({
  onActivate,
  className,
  ...props
}: Omit<ComponentProps<typeof TableRow>, 'onClick' | 'onKeyDown'> & {
  onActivate: () => void;
}) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    // évite que la touche Espace fasse défiler la liste
    event.preventDefault();
    onActivate();
  };

  return (
    <TableRow
      tabIndex={0}
      className={cn(
        'py-2 hover:bg-primary-1 cursor-pointer',
        'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-9',
        className
      )}
      onClick={onActivate}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
};

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
      className={cn(
        'text-primary-9 text-lg',
        emphase ? 'font-semibold' : 'font-medium'
      )}
    >
      {toLocaleFixed(valeur, 2)}
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
}: LigneRowProps & {
  ligne: LigneValeur;
  indentee?: boolean;
}) => {
  const estSelectionnee = ligne.id === selectionneeId;

  const handleActivate = () => {
    if (isPending) return;
    onSelect(estSelectionnee ? null : ligne.id);
  };

  return (
    <ClickableRow
      className={cn(estSelectionnee && '!bg-primary-2')}
      aria-selected={estSelectionnee}
      onActivate={handleActivate}
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
      <ValeurCell
        valeur={ligne.valeur}
        unite={unite}
        emphase={estSelectionnee}
      />
      <SelectionCell selectionnee={estSelectionnee} />
    </ClickableRow>
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
  <ClickableRow aria-expanded={ouverte} onActivate={onToggle}>
    <TableCell className="font-bold text-neutral-700">{annee}</TableCell>
    <TableCell className="py-2">
      {appLabels.sources({ count: nombreSources })}
    </TableCell>
    <TableCell className="py-2 text-right" />
    <TableCell className="py-2 pl-2 text-right">
      <Icon icon={ouverte ? 'arrow-up-s-line' : 'arrow-down-s-line'} />
    </TableCell>
  </ClickableRow>
);

/**
 * Lignes d'une année : la valeur seule si l'année n'a qu'une source, sinon un
 * en-tête dépliable suivi de ses valeurs.
 */
export const GroupeAnneeRows = ({
  groupe,
  ouverte,
  onToggle,
  ...rowProps
}: LigneRowProps & {
  groupe: GroupeAnnee;
  ouverte: boolean;
  onToggle: () => void;
}) => {
  if (groupe.lignes.length === 1) {
    return <IndicateurValeurRow ligne={groupe.lignes[0]} {...rowProps} />;
  }

  return (
    <>
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
            indentee
            {...rowProps}
          />
        ))}
    </>
  );
};
