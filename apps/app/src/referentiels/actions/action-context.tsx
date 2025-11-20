'use client';

import { ReferentielId } from '@tet/domain/referentiels';
import { createContext, ReactNode, useContext } from 'react';
import { z } from 'zod';
import {
  ActionDefinitionSummary,
  useActionDownToTache,
} from '../referentiel-hooks';
import { useAction as useActionById } from '../use-snapshot';

type ContextProps = {
  actionId: string;
  action: ReturnType<typeof useActionById>;
  DEPRECATED_actionDefinition: ActionDefinitionSummary | undefined;
};

const ActionContext = createContext<ContextProps | null>(null);

export function ActionProvider({
  actionId: unsafeActionId,
  children,
}: {
  actionId: string;
  children: ReactNode;
}) {
  const actionId = z.string().parse(unsafeActionId);
  const action = useActionById(actionId);

  const [referentielId, identifiant] = actionId.split('_');

  const actions = useActionDownToTache(
    referentielId as ReferentielId,
    identifiant
  );

  const actionDefinition = actions.find((a) => a.id === actionId);

  return (
    <ActionContext.Provider
      value={{
        actionId,
        action,
        DEPRECATED_actionDefinition: actionDefinition,
      }}
    >
      {children}
    </ActionContext.Provider>
  );
}

function useActionContext() {
  const context = useContext(ActionContext);
  if (!context) {
    throw new Error('useAction must be used within an ActionProvider');
  }
  return context;
}

export function useAction() {
  return useActionContext().action;
}

export function useActionId() {
  return useActionContext().actionId;
}

export function DEPRECATED_useActionDefinition() {
  return useActionContext().DEPRECATED_actionDefinition;
}
