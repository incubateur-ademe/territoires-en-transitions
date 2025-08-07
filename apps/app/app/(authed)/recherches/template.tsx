'use client';

import { getRejoindreCollectivitePath } from '@/api';
import { Alert, Button } from '@/ui';
import { useEffect, useState } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  const [rejoindreUrl, setRejoindreUrl] = useState<string>('');

  useEffect(() => {
    // Set the URL after component mounts on client side
    setRejoindreUrl(getRejoindreCollectivitePath(document.location.origin));
  }, []);

  return (
    <>
      <Alert
        fullPageWidth
        state="info"
        title="Pour accéder à plus de détails sur chacune des collectivités engagées dans le programme, vous devez être membre d’au moins une collectivité."
        className="border-b border-b-info-3"
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
