import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ImportReport } from '../models/import-report';
import { importReferenceErrors } from './import-reference.errors';

type ImportReference =
  | { kind: 'fiche'; collectiviteId: number; ficheId: number }
  | {
      kind: 'indicateur';
      collectiviteId: number;
      indicateurId: number;
      identifiantReferentiel?: never;
    }
  | {
      kind: 'indicateur';
      collectiviteId: number;
      indicateurId?: never;
      identifiantReferentiel: string;
    };

/** Interprète des liens TeT sans les ouvrir ni suivre de redirection HTTP. */
export class ImportReferenceRules {
  static parse(
    reference: string,
    appUrl: string
  ): Result<ImportReference, ImportReport['issues']> {
    const invalid = () =>
      failure([
        {
          code: 'INVALID_IMPORT_REFERENCE_URL',
          ...importReferenceErrors.INVALID_IMPORT_REFERENCE_URL,
        },
      ]);
    const value = reference.trim();
    // URL normalise les espaces et les antislashs : ne pas corriger une référence ambiguë.
    if (/[\s\\]/.test(value)) return invalid();
    let url: URL;
    try {
      url = new URL(value);
      const origins = [
        new URL(appUrl).origin,
        'https://app.territoiresentransitions.fr',
      ];
      if (
        !origins.includes(url.origin) ||
        !['https:', 'http:'].includes(url.protocol) ||
        url.username ||
        url.password
      ) {
        return invalid();
      }
    } catch {
      return invalid();
    }

    // Routes actuelles et redirections maintenues dans next.config.ts.
    const fiche = url.pathname.match(
      /^\/collectivite\/([1-9]\d*)\/(?:actions|plans\/(?:[1-9]\d*\/)?(?:fiches|actions))\/([^/]+)(?:\/(?:details|indicateurs|sous-actions|notes|budget|actions-liees|mesures-liees|documents))?\/?$/
    );
    if (fiche) {
      if (/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(fiche[2])) {
        return failure([
          {
            code: 'UNSUPPORTED_FICHE_UID',
            ...importReferenceErrors.UNSUPPORTED_FICHE_UID,
          },
        ]);
      }
      const collectiviteId = this.parseId(fiche[1]);
      const ficheId = this.parseId(fiche[2]);
      return collectiviteId && ficheId
        ? success({ kind: 'fiche', collectiviteId, ficheId })
        : invalid();
    }

    const indicateur = url.pathname.match(
      /^\/collectivite\/([1-9]\d*)\/indicateurs\/(cae|eci|te|te-test|crte|perso|cles|selection)\/([^/]+)\/?$/
    );
    if (!indicateur) return invalid();
    const collectiviteId = this.parseId(indicateur[1]);
    if (!collectiviteId) return invalid();
    if (indicateur[2] === 'perso') {
      const indicateurId = this.parseId(indicateur[3]);
      return indicateurId
        ? success({ kind: 'indicateur', collectiviteId, indicateurId })
        : invalid();
    }
    // Les vues de catalogue adressent un identifiant de référentiel, pas un ID numérique.
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(indicateur[3])) return invalid();
    return success({
      kind: 'indicateur',
      collectiviteId,
      identifiantReferentiel: indicateur[3],
    });
  }

  private static parseId(value: string): number | null {
    const id = Number(value);
    return /^[1-9]\d*$/.test(value) &&
      Number.isSafeInteger(id) &&
      id <= 2147483647
      ? id
      : null;
  }
}
