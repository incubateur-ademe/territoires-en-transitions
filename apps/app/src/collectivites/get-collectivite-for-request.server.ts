import 'server-only';

import {
  getDossierInstructionCookieName,
  parseDossierInstructionCookie,
} from '@/app/demarches/pcaet/instruction/dossier-instruction-cookie';
import { extractDossierInstructionRefFromPath } from '@/app/demarches/pcaet/instruction/dossier-instruction-path';
import type { DossierInstructionRef } from '@/app/demarches/pcaet/instruction/dossier-instruction-ref';
import {
  canVisitAsInstructeur,
  getCollectivite,
} from '@tet/api/collectivites/index.server';
import { getUser } from '@tet/api/users/user-details.fetch.server';
import { TRPCClientError } from '@trpc/client';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { cache } from 'react';

const toIds = (dossier: DossierInstructionRef | null) => ({
  demandeAvisId:
    dossier && 'demandeAvisId' in dossier ? dossier.demandeAvisId : undefined,
  demarcheId:
    dossier && 'demarcheId' in dossier ? dossier.demarcheId : undefined,
});

/**
 * La collectivité de la requête, avec le contexte d'instruction du dossier que
 * la requête désigne. Les layouts passent par ici plutôt que par
 * `getCollectivite` : celui-ci mémoïse par arguments, et deux appelants qui
 * n'en déduiraient pas le même dossier paieraient deux fois la résolution du
 * contexte.
 *
 * Sur la route d'un dossier, c'est le dossier de l'URL — sa saisine, ou sa
 * démarche pour un dépôt en élaboration — et non le plus récent. Le layout du
 * dossier n'étant rendu qu'après celui de la collectivité, la seule façon de le
 * connaître ici est le chemin courant, que le proxy réécrit et qui n'est donc
 * pas falsifiable (cf. `proxy.ts`).
 *
 * Ailleurs dans la collectivité, c'est le dernier dossier ouvert, mémorisé par
 * la bannière : sans lui, l'agent perdrait la bannière en ouvrant le plan depuis
 * le dossier. Sans dossier mémorisé, pas de contexte : on n'est pas venu par
 * l'instruction. Une saisine peut toutefois ouvrir la collectivité à un
 * non-membre, ce que dit `isVisitAllowedByInstruction`.
 */
export const getCollectiviteForRequest = cache(
  async (collectiviteId: number) => {
    const [requestHeaders, cookieStore] = await Promise.all([
      headers(),
      cookies(),
    ]);

    const dossierFromPath = extractDossierInstructionRefFromPath(
      requestHeaders.get('x-current-path')
    );
    const rememberedDossier = dossierFromPath
      ? null
      : parseDossierInstructionCookie(
          cookieStore.get(getDossierInstructionCookieName(collectiviteId))
            ?.value
        );

    const dossier = toIds(dossierFromPath ?? rememberedDossier);
    let collectivite;
    try {
      collectivite = await getCollectivite(
        collectiviteId,
        dossier.demandeAvisId,
        dossier.demarcheId
      );
    } catch (error) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === 'NOT_FOUND'
      ) {
        notFound();
      }
      throw error;
    }

    // Un dossier mémorisé qui ne résout plus rien (saisine close, droits
    // retirés) : l'appelant efface le cookie, et le store est déjà rendu sans
    // dossier, comme il le sera une fois le cookie parti.
    const isRememberedDossierStale =
      rememberedDossier !== null && collectivite.contexteInstruction === null;
    const ids = isRememberedDossierStale ? toIds(null) : dossier;

    return {
      collectivite,
      ...ids,
      isRememberedDossierStale,
      isVisitAllowedByInstruction: await isVisitAllowedByInstruction(
        collectiviteId,
        collectivite.contexteInstruction !== null
      ),
    };
  }
);

/**
 * Un membre n'a pas besoin de la saisine pour entrer : on lui épargne la
 * requête.
 */
const isVisitAllowedByInstruction = async (
  collectiviteId: number,
  hasContexte: boolean
) => {
  if (hasContexte) {
    return true;
  }
  const user = await getUser();
  const isMembre = user.collectivites.some(
    (acces) => acces.collectiviteId === collectiviteId
  );
  return !isMembre && (await canVisitAsInstructeur(collectiviteId));
};
