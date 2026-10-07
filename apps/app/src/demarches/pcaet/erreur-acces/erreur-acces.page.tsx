'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import { useRouter } from 'next/navigation';

type ErreurAccesPageProps = {
  dashboardHref: string;
};

export const ErreurAccesPage = ({ dashboardHref }: ErreurAccesPageProps) => {
  const router = useRouter();

  return (
    <div
      data-test="demarches.pcaet.erreur-acces"
      className="flex flex-col items-center gap-8 px-6 py-16 text-center"
    >
      <title>{appLabels.erreurAccesTitre}</title>
      <h1 className="mb-0 text-2xl">{appLabels.erreurAccesMessage}</h1>
      <div className="flex flex-wrap justify-center gap-4">
        <Button
          data-test="demarches.pcaet.erreur-acces.retour-tableau-de-bord"
          href={dashboardHref}
        >
          {appLabels.retourTableauDeBord}
        </Button>
        <Button
          data-test="demarches.pcaet.erreur-acces.page-precedente"
          variant="outlined"
          onClick={() => router.back()}
        >
          {appLabels.retourPagePrecedente}
        </Button>
      </div>
    </div>
  );
};
