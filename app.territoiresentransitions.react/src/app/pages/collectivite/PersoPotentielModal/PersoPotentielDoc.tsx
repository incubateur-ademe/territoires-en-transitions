/**
 * Affiche l'onglet "Documentation"
 */
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ActionScore } from '@/app/referentiels/scores.types';
import { toLocaleFixed } from '@/app/utils/toFixed';
import DOMPurify from 'dompurify';
import { TPersonnalisationRegleRead } from './useRegles';

export type TPersoPotentielDocProps = {
  /** Définition de l'action */
  actionDef: ActionDefinitionSummary;
  /** Détail du score associé à l'action */
  actionScore: ActionScore;
  /** Règles de personnalisation applicables */
  regles: TPersonnalisationRegleRead[];
};

export const PersoPotentielDoc = (props: TPersoPotentielDocProps) => {
  const { actionDef, actionScore, regles } = props;
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
          {toLocaleFixed(actionScore.point_referentiel, 2)}
        </li>
      </ul>
    </div>
  );
};
