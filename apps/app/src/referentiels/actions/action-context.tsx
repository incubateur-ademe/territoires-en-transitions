'use client';

import { createContext, ReactNode, useContext } from 'react';
import { z } from 'zod';
import {
  ActionAvailability,
  useActionAvailability,
} from './use-action-availability';
import { ActionListItem } from './use-list-actions';

type ContextProps = {
  actionId: string;
  availability: ActionAvailability;
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

  const availability = useActionAvailability(actionId);
  const action =
    availability.status === 'visible' ? availability.action : undefined;

  return (
    <ActionContext
      value={{
        actionId,
        availability,
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

export function useActionAvailabilityState() {
  return useActionContext().availability;
}

export function useActionId() {
  return useActionContext().actionId;
}
