'use client';

import { appLabels } from '@/app/labels/catalog';
import { makeRejoindreCollectiviteUrl } from '@/app/app/paths';
import { Alert, Button } from '@tet/ui';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Alert
        state="info"
        title="Pour accéder à plus de détails sur chacune des collectivités engagées dans le programme, vous devez être membre d’au moins une collectivité."
        className="mb-10"
        footer={
          <Button
            dataTest="btn-AssocierCollectivite"
            size="xs"
            href={makeRejoindreCollectiviteUrl()}
          >
            {appLabels.rejoindreUneCollectivite}
          </Button>
        }
      />
      {children}
    </>
  );
}
