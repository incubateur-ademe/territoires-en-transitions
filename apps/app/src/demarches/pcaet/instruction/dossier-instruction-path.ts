import { collectiviteBasePath } from '@/app/app/paths';

/**
 * `/collectivite/<id>/instruction/<demandeAvisId>` — la route d'un dossier
 * d'instruction, seule à porter une saisine dans son URL.
 */
const DOSSIER_INSTRUCTION_PATH = new RegExp(
  `^${collectiviteBasePath}/\\d+/instruction/(\\d+)/?$`
);

/**
 * La saisine visée par un chemin de dossier d'instruction, `null` pour tout
 * autre chemin.
 *
 * Sert au layout de collectivité à résoudre le contexte de la saisine que l'URL
 * désigne, et non la plus récente : la bannière et la garde du dossier lisent
 * ainsi la même valeur, et ne peuvent pas nommer deux services différents.
 *
 * Le chemin vient de l'en-tête `x-current-path`, que le proxy réécrit
 * systématiquement depuis `request.nextUrl.pathname` (cf. `proxy.ts`) : il n'est
 * pas falsifiable côté client. Par défense en profondeur on retire malgré tout
 * une éventuelle query string ou ancre avant de comparer — même précaution que
 * `isAllowedWithoutCollectivite`.
 */
export function extractDemandeAvisIdFromPath(
  pathname: string | null | undefined
): number | null {
  if (!pathname) {
    return null;
  }

  const match = DOSSIER_INSTRUCTION_PATH.exec(pathname.split(/[?#]/)[0]);
  if (!match) {
    return null;
  }

  const demandeAvisId = Number(match[1]);
  return Number.isSafeInteger(demandeAvisId) && demandeAvisId > 0
    ? demandeAvisId
    : null;
}
