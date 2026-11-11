import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ImportIndicateurDefinitionType } from './import-indicateur-definition.dto';
import { ImportIndicateurDefinitionError } from './import-indicateur-definition.errors';
import {
  ImportIndicateurReference,
  importIndicateurReferenceSchema,
} from './import-indicateur-reference.dto';
import { GristDocumentRules } from '@tet/backend/utils/grist/grist-document.rules';
import * as z from 'zod/mini';

export class IndicateurReferencesRules {
  static validate(
    references: ImportIndicateurReference[],
    definitions: ImportIndicateurDefinitionType[]
  ): Result<void, ImportIndicateurDefinitionError> {
    const identifiers = new Set(
      definitions.map(({ identifiantReferentiel }) => identifiantReferentiel)
    );
    const seen = new Set<string>();
    for (const reference of references) {
      if (!z.safeParse(importIndicateurReferenceSchema, reference).success) {
        return failure(
          'INVALID_IMPORT',
          new Error(
            'Une référence externe doit définir sa source, son code et un lienSource valide.'
          )
        );
      }
      const { source, codeExterne, identifiantReferentiel } = reference;
      const key = JSON.stringify([source, codeExterne]);
      if (seen.has(key)) {
        return failure(
          'INVALID_IMPORT',
          new Error(`Référence externe dupliquée : ${source} / ${codeExterne}`)
        );
      }
      seen.add(key);
      if (identifiantReferentiel && !identifiers.has(identifiantReferentiel)) {
        return failure(
          'INVALID_IMPORT',
          new Error(
            `Référence externe ${source} / ${codeExterne} : l'indicateur ${identifiantReferentiel} est absent des définitions importées`
          )
        );
      }
    }
    if (
      references.length &&
      (new Set(definitions.map(({ version }) => version)).size !== 1 ||
        !definitions[0]?.version)
    ) {
      return failure(
        'INVALID_IMPORT',
        new Error(
          'Les références externes doivent être publiées avec une version unique des définitions.'
        )
      );
    }
    return this.validateSources(references);
  }

  static validateSources(
    references: Pick<ImportIndicateurReference, 'source' | 'lienSource'>[]
  ): Result<void, ImportIndicateurDefinitionError> {
    const linksBySource = new Map<string, string[]>();
    for (const { source, lienSource } of references) {
      const links = linksBySource.get(source) ?? [];
      links.push(lienSource);
      linksBySource.set(source, links);
    }
    for (const [source, links] of linksBySource) {
      if (
        links.some((link) => GristDocumentRules.isGristUrl(link)) &&
        !GristDocumentRules.getCommonDocumentId(links)
      ) {
        return failure(
          'INVALID_IMPORT',
          new Error(
            `Les liens de la source ${source} doivent désigner un même document Grist HTTPS.`
          )
        );
      }
    }
    return success(undefined);
  }
}
