import {
  makeDossierInstructionUrl,
  makeTdbCollectiviteUrl,
} from '@/app/app/paths';
import { ErreurAccesPage } from '@/app/demarches/pcaet/erreur-acces/erreur-acces.page';
import { getCollectivite } from '@tet/api/collectivites/index.server';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import z from 'zod';

/**
 * Le dossier d'un dépôt **en élaboration**, lu avant toute transmission : il
 * n'a saisi personne, c'est le périmètre du service qui l'ouvre. Même garde que
 * la route par saisine — le contexte résolu par le layout de collectivité doit
 * porter cette démarche, et elle doit être celle de la collectivité de l'URL.
 *
 * Une fois le dossier transmis, le service y accède par sa saisine : la route
 * par démarche renvoie alors vers l'URL canonique plutôt que d'offrir une
 * seconde adresse au même dossier.
 */
export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ collectiviteId: string; demarcheId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId, demarcheId: unsafeDemarche } =
    await params;
  const collectiviteId = z.coerce.number().parse(unsafeCollectiviteId);
  const demarcheId = z.coerce.number().parse(unsafeDemarche);

  const { contexteInstruction } = await getCollectivite(
    collectiviteId,
    undefined,
    demarcheId
  );

  if (contexteInstruction?.demarcheId !== demarcheId) {
    return (
      <ErreurAccesPage
        dashboardHref={makeTdbCollectiviteUrl({ collectiviteId })}
      />
    );
  }

  if (contexteInstruction.demandeAvisId !== null) {
    redirect(
      makeDossierInstructionUrl({
        collectiviteInstruiteId: collectiviteId,
        demandeAvisId: contexteInstruction.demandeAvisId,
      })
    );
  }

  return children;
}
