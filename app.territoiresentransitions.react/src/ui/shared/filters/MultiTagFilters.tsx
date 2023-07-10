import classNames from 'classnames';

type TOption = {value: string; label: string};

type MultiTagFiltersProps = {
  options: TOption[];
  disabledOptions?: TOption[];
  values?: string[];
  className?: string;
  small?: boolean;
  onChange: (value: string) => void;
};

/**
 * Ensemble de boutons sous formes de tags
 * Permet de mettre en place un filtre avec une ou plusieurs valeurs sélectionnées
 *
 * @param options
 * Options disponibles dans le filtre
 * @param disabledOptions
 * Options complémentaires ajoutées en fin de ligne en mode "disabled"
 * @param values
 * Valeurs des options sélectionnées
 * @param className
 * Classname custom à appliquer sur le container du filtre (optionnel)
 * @param small
 * Affichage xs des tags (optionnel, par défaut à "false")
 * @param onChange
 * Renvoie la valeur sélectionnée
 */
const MultiTagFilters = ({
  options,
  disabledOptions,
  values = [],
  className = '',
  small = false,
  onChange,
}: MultiTagFiltersProps) => {
  const tagClassname = classNames('fr-tag', {'fr-tag--sm': small});

  return (
    <div className={classNames(`flex flex-wrap gap-4`, className)}>
      {options.map(opt => (
        <button
          key={opt.value}
          className={tagClassname}
          aria-pressed={values.includes(opt.value)}
          onClick={() => {
            onChange(opt.value);
          }}
        >
          {opt.label}
        </button>
      ))}
      {disabledOptions?.map(opt => (
        <button key={opt.value} className={tagClassname} disabled>
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default MultiTagFilters;
