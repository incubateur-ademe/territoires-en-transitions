'use client';

import { DEPRECATED_useActionDefinition } from '@/app/referentiels/actions/action-context';
import { ActionAuditDetail } from '@/app/referentiels/audits/ActionAuditDetail';

export default function Page() {
  const actionDefinition = DEPRECATED_useActionDefinition();

  if (!actionDefinition) return null;

  return (
    <section>
      <ActionAuditDetail action={actionDefinition} />
    </section>
  );
}
