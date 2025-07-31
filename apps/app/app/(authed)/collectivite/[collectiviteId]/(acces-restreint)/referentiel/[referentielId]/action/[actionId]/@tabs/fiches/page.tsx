'use client';

import { FichesActionLiees } from '@/app/referentiels/action.show/FichesActionLiees';
import { DEPRECATED_useActionDefinition } from '@/app/referentiels/actions/action-context';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';

export default function Page() {
  const actionDefinition = DEPRECATED_useActionDefinition();

  if (!actionDefinition) {
    return <SpinnerLoader />;
  }

  return <FichesActionLiees actionId={actionDefinition.id} />;
}
