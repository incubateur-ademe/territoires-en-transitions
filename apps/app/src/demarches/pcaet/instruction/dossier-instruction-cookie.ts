import type { DossierInstructionRef } from './dossier-instruction-ref';

/**
 * Le dernier dossier qu'un agent a ouvert dans une collectivité, pour que la
 * bannière d'instruction le suive hors des routes de dossier — le plan de la
 * collectivité ouvert dans un nouvel onglet, par exemple. Sans lui, un agent qui
 * est aussi membre de la collectivité instruite y serait tenu pour « chez lui ».
 *
 * Un cookie de session par collectivité, lisible côté client : deux onglets
 * ouverts sur les dossiers de deux collectivités ne s'écrasent pas. La bannière
 * le pose sur la route du dossier ; le retour à la liste des dossiers, la
 * déconnexion et un dossier devenu inaccessible l'effacent. Il ne fait que
 * *désigner* une saisine : le serveur vérifie qu'elle est bien celle de
 * l'utilisateur, une valeur forgée ne résout aucun contexte.
 */
const COOKIE_PREFIX = 'tet_dossier_instruction_';

export const getDossierInstructionCookieName = (collectiviteId: number) =>
  `${COOKIE_PREFIX}${collectiviteId}`;

/** `41` pour une saisine, `demarche:12` pour un dépôt en élaboration. */
const COOKIE_VALUE = /^(demarche:)?(\d+)$/;

export function serializeDossierInstructionCookie(
  dossier: DossierInstructionRef
): string {
  return 'demarcheId' in dossier
    ? `demarche:${dossier.demarcheId}`
    : `${dossier.demandeAvisId}`;
}

export function parseDossierInstructionCookie(
  value: string | null | undefined
): DossierInstructionRef | null {
  const match = value ? COOKIE_VALUE.exec(value) : null;
  if (!match) {
    return null;
  }

  const id = Number(match[2]);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  return match[1] ? { demarcheId: id } : { demandeAvisId: id };
}

const setCookie = (name: string, value: string, attributes = '') => {
  document.cookie = `${name}=${value}; path=/; SameSite=Lax${attributes}`;
};

/** @param value issue de `serializeDossierInstructionCookie`. */
export function writeDossierInstructionCookie(
  collectiviteId: number,
  value: string
) {
  setCookie(getDossierInstructionCookieName(collectiviteId), value);
}

export function clearDossierInstructionCookie(collectiviteId: number) {
  setCookie(getDossierInstructionCookieName(collectiviteId), '', '; max-age=0');
}

/** À la déconnexion : les dossiers mémorisés de toutes les collectivités. */
export function clearAllDossierInstructionCookies() {
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim();
    if (name.startsWith(COOKIE_PREFIX)) {
      setCookie(name, '', '; max-age=0');
    }
  }
}
