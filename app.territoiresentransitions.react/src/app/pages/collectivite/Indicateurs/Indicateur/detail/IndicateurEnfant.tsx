import classNames from 'classnames';
import { TIndicateurDefinition } from '../../types';
import { IndicateurEnfantHeader } from './IndicateurEnfantHeader';
import { IndicateurEnfantContent } from './IndicateurEnfantContent';
import { useState } from 'react';

/** Affiche le détail d'un indicateur enfant */
export const IndicateurEnfant = ({
  definition,
  actionsLieesCommunes,
  isOpen = false,
  className,
}: {
  definition: TIndicateurDefinition;
  actionsLieesCommunes: string[];
  isOpen?: boolean;
  className?: string;
}) => {
  const [open, setOpen] = useState(isOpen);

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
        toggle={() => setOpen(!open)}
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
