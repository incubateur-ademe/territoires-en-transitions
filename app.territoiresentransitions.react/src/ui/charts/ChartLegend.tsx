import classNames from 'classnames';

/** Élement représentatif d'une donnée dans la légende */
export type ChartLegendItem = {
  /** Nom affiché */
  name: string;
  /** Couleur du symbole */
  color: string;
  /** Symbole custom */
  symbole?: (color: string) => React.ReactNode;
};

/** Propriété de la légende par défaut */
export type ChartLegendProps = {
  /** Etat d'ouverture */
  isOpen: boolean;
  /** Les éléments représentants les données de la légende */
  items?: ChartLegendItem[];
  /** Taille des éléments de la légende */
  size?: 'sm' | 'md';
  /** Styles donnés au container */
  className?: string;
  /** Limitation du nombre d'éléments visibles */
  maxItems?: number;
};

/** Légende par défaut utilisée dans les charts */
const ChartLegend = ({
  className,
  items = [],
  size = 'md',
  maxItems,
}: ChartLegendProps) => {
  const displayedItems = items.slice(0, maxItems) ?? [];

  return (
    <div
      className={classNames(
        'flex items-center justify-center flex-wrap gap-x-8 gap-y-4 mx-auto',
        {
          'gap-x-4 gap-y-2 text-sm': size === 'sm',
          'mt-4': size === 'md',
        },
        className
      )}
    >
      {displayedItems.map(({ name, color, symbole }) => (
        <div key={name} className="flex items-center gap-2">
          {symbole ? (
            symbole(color)
          ) : (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
          <div>{name}</div>
        </div>
      ))}
      {!!maxItems && items.length > maxItems && (
        <div>+ {items.length - maxItems}</div>
      )}
    </div>
  );
};

/** Représente une ligne pointillée pour la légende du graphe (peut être passé à
 * la props "symbole") */
export const DashedLineSymbol = (backgroundColor: string) => (
  <div className="flex gap-1 w-5 min-w-5">
    <div className="h-1 grow" style={{ backgroundColor }} />
    <div className="h-1 grow" style={{ backgroundColor }} />
  </div>
);

/** Représente une ligne continue pour la légende du graphe (peut être passé à
 * la props "symbole") */
export const SolidLineSymbol = (backgroundColor: string) => (
  <div className="w-5 min-w-5 h-1" style={{ backgroundColor }} />
);

/** Représente une surface pour la légende du graphe (peut être passé à
 * la props "symbole") */
export const AreaSymbol = (backgroundColor: string) => (
  <div
    className="w-3.5 min-w-3.5 h-2.5 rounded-sm"
    style={{ backgroundColor }}
  />
);

export default ChartLegend;
