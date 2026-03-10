'use client';

import { createContext, ReactNode, useContext } from 'react';
import { z } from 'zod';
import { useGetAction } from './use-get-action';
import { ActionListItem } from './use-list-actions';

type ContextProps = {
  actionId: string;
  action: ActionListItem | undefined;
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

  const action = useGetAction({ actionId });

  return (
    <ActionContext
      value={{
        actionId,
        action,
      }}
    >
      {children}
    </ActionContext>
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
