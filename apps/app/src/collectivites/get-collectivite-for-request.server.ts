import 'server-only';

import {
  getDossierInstructionCookieName,
  parseDossierInstructionCookie,
} from '@/app/demarches/pcaet/instruction/dossier-instruction-cookie';
import { extractDossierInstructionRefFromPath } from '@/app/demarches/pcaet/instruction/dossier-instruction-path';
import type { DossierInstructionRef } from '@/app/demarches/pcaet/instruction/dossier-instruction-ref';
import { getCollectivite } from '@tet/api/collectivites/index.server';
import { cookies, headers } from 'next/headers';
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
 * la bannière : sans lui, l'agent membre de la collectivité qu'il instruit
 * perdrait la bannière en ouvrant le plan depuis le dossier.
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
    const collectivite = await getCollectivite(
      collectiviteId,
      dossier.demandeAvisId,
      dossier.demarcheId
    );

    // Un dossier mémorisé qui ne résout plus rien (saisine close, droits
    // retirés) ne doit pas faire perdre à un non-membre la saisine la plus
    // récente, qui lui ouvre la collectivité. L'appelant efface le cookie.
    const isRememberedDossierStale =
      rememberedDossier !== null && collectivite.contexteInstruction === null;
    if (isRememberedDossierStale) {
      return {
        collectivite: await getCollectivite(collectiviteId),
        ...toIds(null),
        isRememberedDossierStale,
      };
    }

    return { collectivite, ...dossier, isRememberedDossierStale };
  }
);
