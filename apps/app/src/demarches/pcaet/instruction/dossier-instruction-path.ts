import { collectiviteBasePath } from '@/app/app/paths';
import type { DossierInstructionRef } from './dossier-instruction-ref';

/**
 * Les routes d'un dossier, seules à porter dans leur URL ce qui l'ouvre : la
 * saisine (`/instruction/41`), ou la démarche d'un dépôt en élaboration
 * (`/instruction/demarche/12`).
 */
const DOSSIER_INSTRUCTION_PATH = new RegExp(
  `^${collectiviteBasePath}/\\d+/instruction/(demarche/)?(\\d+)/?$`
);

/**
 * Le dossier visé par un chemin, `null` pour tout autre chemin. Le layout de
 * collectivité s'en sert pour résoudre le contexte du dossier ouvert, et non le
 * plus récent.
 *
 * Le chemin vient de `x-current-path`, réécrit par le proxy, donc non
 * falsifiable ; la query string est malgré tout retirée, comme dans
 * `isAllowedWithoutCollectivite`.
 */
export function extractDossierInstructionRefFromPath(
  pathname: string | null | undefined
): DossierInstructionRef | null {
  if (!pathname) {
    return null;
  }

  const match = DOSSIER_INSTRUCTION_PATH.exec(pathname.split(/[?#]/)[0]);
  if (!match) {
    return null;
  }

  const id = Number(match[2]);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  return match[1] ? { demarcheId: id } : { demandeAvisId: id };
}

const COLLECTIVITE_PATH = new RegExp(
  `^${collectiviteBasePath}/(\\d+)(?:[/?#]|$)`
);

/**
 * La collectivité dans laquelle on navigue, `null` hors de toute collectivité
 * (profil, recherches, raccourci `/collectivite/tableau-de-bord`…).
 */
export function extractCollectiviteIdFromPath(
  pathname: string | null | undefined
): number | null {
  const match = pathname ? COLLECTIVITE_PATH.exec(pathname) : null;
  const id = match ? Number(match[1]) : null;
  return id !== null && Number.isSafeInteger(id) && id > 0 ? id : null;
}
