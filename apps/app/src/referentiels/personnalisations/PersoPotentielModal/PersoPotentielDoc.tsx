/**
 * Affiche l'onglet "Documentation"
 */
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import DOMPurify from 'dompurify';
import { ActionListItem } from '../../actions/use-list-actions';
import { TPersonnalisationRegleRead } from './useRegles';

export type TPersoPotentielDocProps = {
  /** Définition de l'action */
  action: ActionListItem;
  /** Règles de personnalisation applicables */
  regles: TPersonnalisationRegleRead[];
};

export const PersoPotentielDoc = ({
  action,
  regles,
}: TPersoPotentielDocProps) => {
  const score = action.score;

  const pointReferentiel = score?.pointReferentiel;

  if (pointReferentiel === undefined) {
    return null;
  }

  return (
    <div data-test="PersoPotentielDoc" className="p-mb-0">
      <ul>
        {regles.map(({ description }, index) =>
          description ? (
            <li
              key={`r${index}`}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(description),
              }}
            />
          ) : null
        )}
        <li>
          Nombre de points initial pour cette {action.actionType} :{' '}
          {toLocaleFixed(pointReferentiel, 2)}
        </li>
      </ul>
    </div>
  );
};
