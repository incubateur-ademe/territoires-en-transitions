'use client';

import {
  useActionAvailabilityState,
} from '@/app/referentiels/actions/action-context';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ActionHiddenView } from './_components/action-hidden.view';
import { ActionNotFoundView } from './_components/action-not-found.view';
import { ActionView } from './_components/action.view';
import { ActionSidePanelProvider } from './_components/side-panel/context';

export default function Page() {
  const availability = useActionAvailabilityState();

  if (availability.status === 'pending') {
    return <SpinnerLoader className="m-auto" />;
  }

  if (availability.status === 'hidden') {
    return <ActionHiddenView action={availability.action} />;
  }
  if (availability.status === 'not_found') {
    return <ActionNotFoundView />;
  }

  const action = availability.action;

  return (
    <ActionSidePanelProvider action={action}>
      <ActionView action={action} />
    </ActionSidePanelProvider>
  );
}
