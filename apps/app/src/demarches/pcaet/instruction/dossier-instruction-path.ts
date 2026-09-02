import { collectiviteBasePath } from '@/app/app/paths';

/** La route d'un dossier, seule à porter une saisine dans son URL. */
const DOSSIER_INSTRUCTION_PATH = new RegExp(
  `^${collectiviteBasePath}/\\d+/instruction/(\\d+)/?$`
);

/**
 * La saisine visée par un chemin de dossier, `null` pour tout autre chemin. Le
 * layout de collectivité s'en sert pour résoudre le contexte de la saisine
 * ouverte, et non la plus récente.
 *
 * Le chemin vient de `x-current-path`, réécrit par le proxy, donc non
 * falsifiable ; la query string est malgré tout retirée, comme dans
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
