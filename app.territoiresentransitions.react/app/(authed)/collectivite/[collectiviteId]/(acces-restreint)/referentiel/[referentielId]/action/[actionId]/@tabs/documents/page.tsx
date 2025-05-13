'use client';

import { DEPRECATED_useActionDefinition } from '@/app/referentiels/actions/action-context';
import { DownloadDocs } from '@/app/referentiels/actions/action-documents.download-button';
import ActionPreuvePanel from '@/app/referentiels/actions/action-preuve.panel';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';

export default function Page() {
  const actionDefinition = DEPRECATED_useActionDefinition();

  if (!actionDefinition) {
    return <SpinnerLoader />;
  }

  return (
    <section>
      <ActionPreuvePanel withSubActions showWarning action={actionDefinition} />
      <DownloadDocs action={actionDefinition} />
    </section>
  );
}
