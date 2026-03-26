'use client';

import { useAction } from '@/app/referentiels/actions/action-context';
import { ActionAuditDetail } from '@/app/referentiels/audits/ActionAuditDetail';

export default function Page() {
  const action = useAction();

  if (!action) return null;

  return (
    <section>
      <ActionAuditDetail action={action} />
    </section>
  );
}
