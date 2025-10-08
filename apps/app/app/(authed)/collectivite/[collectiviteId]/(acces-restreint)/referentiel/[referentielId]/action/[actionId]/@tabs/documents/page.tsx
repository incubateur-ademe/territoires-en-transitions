'use client';

import { DEPRECATED_useActionDefinition } from '@/app/referentiels/actions/action-context';
import { DownloadDocs } from '@/app/referentiels/actions/action-documents.download-button';
import ActionPreuvePanel from '@/app/referentiels/actions/action-preuve.panel';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Divider } from '@/ui';

export default function Page() {
  const actionDefinition = DEPRECATED_useActionDefinition();

  if (!actionDefinition) {
    return <SpinnerLoader className="m-auto" />;
  }

  return (
    <section className="flex flex-col gap-5">
      <DownloadDocs action={actionDefinition} className="ml-auto" />

      <Divider color="grey" className="-mb-6" />

      <ActionPreuvePanel withSubActions showWarning action={actionDefinition} />
    </section>
  );
}
