/**
 * Affiche l'onglet "Documentation"
 */
import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { useScore } from '@/app/referentiels/use-snapshot';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import DOMPurify from 'dompurify';
import { TPersonnalisationRegleRead } from './useRegles';

export type TPersoPotentielDocProps = {
  /** Définition de l'action */
  actionDef: ActionDefinitionSummary;
  /** Règles de personnalisation applicables */
  regles: TPersonnalisationRegleRead[];
};

export const PersoPotentielDoc = ({
  actionDef,
  regles,
}: TPersoPotentielDocProps) => {
  const score = useScore(actionDef.id);

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
          Nombre de points initial pour cette {actionDef.type} :{' '}
          {toLocaleFixed(pointReferentiel, 2)}
        </li>
      </ul>
    </div>
  );
};
