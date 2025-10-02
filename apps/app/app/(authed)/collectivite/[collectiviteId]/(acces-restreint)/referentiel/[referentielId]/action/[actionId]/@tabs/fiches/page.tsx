'use client';

import { FichesActionLiees } from '@/app/referentiels/action.show/FichesActionLiees';
import { useActionId } from '@/app/referentiels/actions/action-context';

export default function Page() {
  const actionId = useActionId();

  return <FichesActionLiees actionId={actionId} />;
}
