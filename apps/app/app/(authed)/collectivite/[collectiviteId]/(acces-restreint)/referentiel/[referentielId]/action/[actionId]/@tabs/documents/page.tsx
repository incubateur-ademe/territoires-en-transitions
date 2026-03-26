'use client';

import { useAction } from '@/app/referentiels/actions/action-context';
import { DownloadDocs } from '@/app/referentiels/actions/action-documents.download-button';
import ActionPreuvePanel from '@/app/referentiels/actions/action-preuve.panel';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Divider } from '@tet/ui';

export default function Page() {
  const action = useAction();

  if (!action) {
    return <SpinnerLoader className="m-auto" />;
  }

  return (
    <section className="flex flex-col gap-5">
      <DownloadDocs action={action} className="ml-auto" />

      <Divider />

      <ActionPreuvePanel withSubActions showWarning action={action} />
    </section>
  );
}
