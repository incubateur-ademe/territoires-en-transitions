import {MouseEventHandler} from 'react';
import {YellowHighlight} from 'ui/Highlight';

export type TPotentielActionProps = {
  /** Potentiel de points de la sous-action */
  points: number;
  /** Indique si le potentiel a été réduit */
  isReduced?: boolean;
  /** Fonction appelée quand le bouton Personnaliser est cliqué (le bouton ne
   * s'affiche pas si absent) */
  onEdit?: MouseEventHandler;
};

/** Affiche le potentiel de points (normal ou réduit) ainsi qu'un bouton
 * "Personnaliser" si nécessaire */
export const PotentielAction = ({
  points,
  isReduced,
  onEdit,
}: TPotentielActionProps) => {
  const label = isReduced
    ? 'Potentiel réduit pour cette sous-action'
    : 'Potentiel pour cette sous-action';

  return (
    <YellowHighlight>
      <div className="flex items-center">
        {`${label} : ${points.toLocaleString(undefined, {
          maximumFractionDigits: 1,
        })} points`}
        {typeof onEdit === 'function' ? (
          <a
            className="fr-link fr-link--icon-left fr-fi-settings-line fr-ml-10v"
            href="#"
            onClick={onEdit}
          >
            Personnaliser
          </a>
        ) : null}
      </div>
    </YellowHighlight>
  );
};
