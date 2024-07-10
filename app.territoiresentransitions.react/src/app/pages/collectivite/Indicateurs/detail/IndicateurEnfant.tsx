import classNames from 'classnames';
import {TIndicateurDefinition} from '../types';
import {useToggle} from 'ui/shared/useToggle';
import {IndicateurEnfantHeader} from './IndicateurEnfantHeader';
import {IndicateurEnfantContent} from './IndicateurEnfantContent';

/** Affiche le détail d'un indicateur enfant */
export const IndicateurEnfant = ({
  definition,
  actionsLieesCommunes,
  isOpen,
  className,
}: {
  definition: TIndicateurDefinition;
  actionsLieesCommunes: string[];
  isOpen?: boolean;
  className?: string;
}) => {
  const [open, toggle] = useToggle(isOpen || false);

  return (
    <div
      className={classNames(
        'border border-[#e5e5e5] rounded-lg my-4',
        className
      )}
    >
      <IndicateurEnfantHeader
        definition={definition}
        open={open}
        toggle={toggle}
      />
      {open && (
        <IndicateurEnfantContent
          definition={definition}
          actionsLieesCommunes={actionsLieesCommunes}
        />
      )}
    </div>
  );
};
