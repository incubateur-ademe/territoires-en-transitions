import type { Workflow } from './workflow.types';

/**
 * Rend un workflow en diagramme Mermaid `stateDiagram-v2` : les transitions
 * sont les flèches et leurs guards l'étiquette.
 *
 * Sert à faire relire un cycle de vie par le métier sans lire de TypeScript —
 * le diagramme est dérivé de la définition, il ne peut donc pas la contredire.
 */
export const workflowToMermaid = <
  TStatus extends string,
  TTransition extends string,
  TGuardId extends string
>(
  workflow: Workflow<TStatus, TTransition, TGuardId>
): string => {
  const guardsLabel = (guards: readonly TGuardId[] | undefined): string =>
    guards?.length ? ` [${guards.join(', ')}]` : '';

  const arrows = workflow.transitionNames.flatMap((transition) => {
    const def = workflow.getTransitionDef(transition);
    return def.from.map(
      (from) =>
        `  ${from} --> ${def.to} : ${transition}${guardsLabel(def.guards)}`
    );
  });

  return [
    'stateDiagram-v2',
    `  [*] --> ${workflow.initialStatus}`,
    ...arrows,
  ].join('\n');
};
