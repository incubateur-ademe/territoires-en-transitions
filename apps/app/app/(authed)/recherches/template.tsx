'use client';

import { getRejoindreCollectivitePath } from '@tet/api';
import { Alert, Button } from '@tet/ui';
import { useEffect, useEffectEvent, useState } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  const [rejoindreUrl, setRejoindreUrl] = useState<string>('');
  const updateRejoindreUrl = useEffectEvent((value: string) =>
    setRejoindreUrl(value)
  );

  useEffect(() => {
    // Set the URL after component mounts on client side
    updateRejoindreUrl(getRejoindreCollectivitePath(document.location.origin));
  }, []);

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
            href={rejoindreUrl}
          >
            Rejoindre une collectivité
          </Button>
        }
      />
      {children}
    </>
  );
}
