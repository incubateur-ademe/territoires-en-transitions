import { SecteursProposes } from '@tet/backend/plans/fiches/fiche-secteurs/secteurs-proposes';
import { UpdateFicheInput } from '../../../fiches/update-fiche/update-fiche.input';

interface ImportAxePath {
  path: string[];
  fullPath: string;
  depth: number;
  parentPath?: string[];
}

/** Forme intermédiaire des imports génériques, avant attribution des clés locales. */
export interface FicheWithRelationsAndAxisPath {
  axisPath?: string[];
  fiche: Omit<UpdateFicheInput, 'collectiviteId'>;
  parentActionTitre?: string;
  secteursProposes?: SecteursProposes;
}

/** Les imports génériques identifient les parents par leur chemin et leur titre. */
export class ImportPlanHierarchy {
  private static readonly PATH_SEPARATOR = '::';

  static serializePath(path: string[]): string {
    return path.join(this.PATH_SEPARATOR);
  }

  static getActionKey(titre: string, axisPath: string[] = []): string {
    return this.serializePath([...axisPath, titre]);
  }

  static extractAxes(paths: string[][]): ImportAxePath[] {
    const uniquePaths = new Set<string>();
    for (const path of paths) {
      // Chaque chemin matérialise aussi tous ses parents implicites.
      for (let depth = 1; depth <= path.length; depth++) {
        uniquePaths.add(this.serializePath(path.slice(0, depth)));
      }
    }
    return [...uniquePaths]
      .map((fullPath) => {
        const path = fullPath.split(this.PATH_SEPARATOR);
        return {
          path,
          fullPath,
          depth: path.length,
          parentPath: path.length > 1 ? path.slice(0, -1) : undefined,
        };
      })
      .sort((a, b) => a.depth - b.depth);
  }

  static validate(
    nom: string,
    fiches: FicheWithRelationsAndAxisPath[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (nom.length === 0) errors.push('Le nom du plan ne peut pas être vide');

    const missingParents = this.findMissingParentPaths(fiches);
    if (missingParents.length > 0) {
      errors.push(
        `Axes parents manquants : ${missingParents
          .map((path) => path.join(' > '))
          .join(', ')}`
      );
    }

    const orphanedSousActions = this.findOrphanedSousActions(fiches);
    if (orphanedSousActions.length > 0) {
      errors.push(
        `Sous-actions sans action parente : ${orphanedSousActions.join(', ')}`
      );
    }

    const duplicateKeys = this.findDuplicateActionKeys(fiches);
    if (duplicateKeys.length > 0) {
      errors.push(
        `Titres d'actions en doublon dans le même axe : ${duplicateKeys.join(
          ', '
        )}`
      );
    }
    return { isValid: errors.length === 0, errors };
  }

  private static findMissingParentPaths(
    fiches: FicheWithRelationsAndAxisPath[]
  ): string[][] {
    const axes = this.extractAxes(
      fiches.flatMap(({ axisPath }) => (axisPath?.length ? [axisPath] : []))
    );
    const paths = new Set(axes.map(({ fullPath }) => fullPath));
    // Un libellé contenant le séparateur peut produire un parent absent.
    return axes.flatMap(({ parentPath }) =>
      parentPath && !paths.has(this.serializePath(parentPath))
        ? [parentPath]
        : []
    );
  }

  private static findOrphanedSousActions(
    fiches: FicheWithRelationsAndAxisPath[]
  ): string[] {
    const parentKeys = new Set(
      fiches
        .filter(({ parentActionTitre }) => !parentActionTitre)
        .flatMap(({ fiche, axisPath }) =>
          fiche.titre ? [this.getActionKey(fiche.titre, axisPath)] : []
        )
    );
    return fiches.flatMap(({ fiche, parentActionTitre, axisPath }) =>
      parentActionTitre &&
      !parentKeys.has(this.getActionKey(parentActionTitre, axisPath))
        ? [`"${fiche.titre}" (action parente: "${parentActionTitre}")`]
        : []
    );
  }

  private static findDuplicateActionKeys(
    fiches: FicheWithRelationsAndAxisPath[]
  ): string[] {
    const occurrences = new Map<string, number>();
    for (const { fiche, axisPath, parentActionTitre } of fiches) {
      if (parentActionTitre || !fiche.titre) continue;
      const key = this.getActionKey(fiche.titre, axisPath);
      occurrences.set(key, (occurrences.get(key) ?? 0) + 1);
    }
    return [...occurrences]
      .filter(([, count]) => count > 1)
      .map(([key]) => key);
  }
}
