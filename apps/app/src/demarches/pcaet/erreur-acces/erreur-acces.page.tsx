'use client';

import { appLabels } from '@/app/labels/catalog';
import { useTrackDemarcheView } from '@/app/demarches/use-demarche-tracker';
import { Button, Event } from '@tet/ui';
import { usePathname, useRouter } from 'next/navigation';

type ErreurAccesPageProps = {
  dashboardHref: string;
};

export const ErreurAccesPage = ({ dashboardHref }: ErreurAccesPageProps) => {
  const router = useRouter();
  const pathname = usePathname();
  // Les paramètres de route (démarche, saisine) partent avec l'événement : ils
  // disent quel dossier a été refusé, et à qui.
  useTrackDemarcheView(Event.demarches.pcaet.accesRefuse, {
    key: pathname,
    properties: {
      espace: pathname.includes('/instruction')
        ? 'instruction'
        : pathname.includes('/demandes-avis')
        ? 'demandes_avis'
        : pathname.includes('/referents-pcaet')
        ? 'referents'
        : 'depot',
    },
  });

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
