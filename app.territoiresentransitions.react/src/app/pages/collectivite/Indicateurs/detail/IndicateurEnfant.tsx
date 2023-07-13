import classNames from 'classnames';
import {TIndicateurReferentielDefinition} from '../types';
import {IndicateurValuesTabs} from './IndicateurValuesTabs';
import {Badge} from 'ui/shared/Badge';
import {BadgeACompleter} from 'ui/shared/Badge/BadgeACompleter';
import {useToggle} from 'ui/shared/useToggle';
import {ExpandToggle} from 'ui/icons/ExpandToggle';
import {useIndicateurACompleter} from '../useIndicateurDefinitions';
import {ActionsLieesCards} from '../../PlansActions/FicheAction/FicheActionForm/ActionsLiees';
import IndicateurChart from '../charts/IndicateurChart';
import {FichesActionLiees} from '../FichesActionLiees';

export const IndicateurEnfant = ({
  definition,
  actionsLieesCommunes,
  isOpen,
  className,
}: {
  definition: TIndicateurReferentielDefinition;
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
/** Affiche l'en-tête du détail d'un indicateur enfant */
const IndicateurEnfantHeader = ({
  definition,
  open,
  toggle,
}: {
  definition: TIndicateurReferentielDefinition;
  open: boolean;
  toggle: () => void;
}) => {
  const a_completer = useIndicateurACompleter(definition.id);

  return (
    <div
      className={classNames(
        'flex justify-between items-center px-6 py-4 rounded-lg cursor-pointer',
        {
          'bg-[#f5f5fE]': open,
          'hover:bg-grey975': !open,
        }
      )}
      onClick={toggle}
    >
      <div>
        <ExpandToggle open={open} />
        <span className="font-bold">{definition.nom}</span>
      </div>
      <div>
        {definition.participation_score && (
          <Badge status="no-icon">Participe au score</Badge>
        )}
        <BadgeACompleter className="min-w-max" a_completer={a_completer} />
      </div>
    </div>
  );
};
/** Affiche le contenu du détail d'un indicateur enfant */
const IndicateurEnfantContent = ({
  definition,
  actionsLieesCommunes,
}: {
  definition: TIndicateurReferentielDefinition;
  actionsLieesCommunes: string[];
}) => {
  //
  const actionsLiees = definition.actions
    ?.filter(action_id => !actionsLieesCommunes.includes(action_id))
    .map(id => ({id}));

  return (
    <div className="p-6">
      <IndicateurChart
        className="fr-mb-3w"
        variant="zoomed"
        definition={definition}
      />
      <IndicateurValuesTabs definition={definition} />
      {
        /** actions liées */
        actionsLiees?.length ? (
          <>
            <p className="fr-mt-4w fr-mb-1w font-medium">
              {actionsLiees.length > 1
                ? 'Actions référentiel liées'
                : 'Action référentiel liée'}
            </p>
            <ActionsLieesCards actions={actionsLiees} />
          </>
        ) : null
      }
      <FichesActionLiees definition={definition} />
    </div>
  );
};
