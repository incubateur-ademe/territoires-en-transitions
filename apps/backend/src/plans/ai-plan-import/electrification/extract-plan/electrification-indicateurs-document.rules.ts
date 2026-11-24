import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ElectrificationConfig } from '@tet/domain/plans';
import { ImportReferenceRules } from '../../resolve-import-reference/import-reference.rules';
import { ElectrificationIssue } from '../electrification-issue';
import { ElectrificationDocumentValues as Values } from './electrification-document-values.rules';
import { ElectrificationExtractionErrors as Errors } from './electrification-extraction.errors';
import {
  ElectrificationDocumentSource as Source,
  ElectrificationExtractionResponse,
} from './electrification-extraction.schema';
import { electrificationIndicateursDocument } from '@tet/backend/plans/plans/electrification/config/electrification-indicateurs-document.config';
import { ElectrificationValueInterpretationRules as Interpretation } from './electrification-value-interpretation.rules';
import { ElectrificationIndicateurCells } from './electrification-indicateur-cells.types';
import {
  ElectrificationValueContext,
  ElectrificationValueRequest,
} from './electrification-value-interpretation.schema';

type Indicateur =
  ElectrificationExtractionResponse['fiches'][number]['indicateurs'][number];
type Observation = {
  value: number | boolean | null;
  year: number | null;
  unit: string | null;
};

/** Interprète les cellules nommées, indépendamment du format du canevas. */
export class ElectrificationIndicateursDocumentRules {
  static parse(
    cells: ElectrificationIndicateurCells,
    catalogue: ElectrificationConfig,
    valueContext?: ElectrificationValueContext
  ): Result<Indicateur | null, ElectrificationIssue[]> {
    const {
      reference,
      titre: title,
      resultat: result,
      objectif: target,
      objectifComplementaire: otherTarget,
    } = cells;
    const { fields } = electrificationIndicateursDocument;
    const referenceValue = Values.reference(
      reference,
      fields.reference.placeholder
    );
    const mapping = catalogue.fiches.indicateurs.find(
      ({ code }) => code === referenceValue.value
    );
    const mergedTitle = reference.id === title.id;
    const carriesReference =
      mapping !== undefined ||
      reference.links.length > 0 ||
      ImportReferenceRules.isUrlReference(referenceValue.value);
    // Une cellule fusionnée conserve son code ou son lien ; sinon elle porte
    // le titre d'un indicateur libre, comme dans le canevas V1.
    const ref =
      mergedTitle && !carriesReference
        ? { sourceId: null, value: null }
        : referenceValue;
    const titre =
      mergedTitle && carriesReference
        ? null
        : Values.text(title, fields.titre.placeholder);
    if (
      ref.sourceId === null &&
      titre === null &&
      !result.text.trim() &&
      !target.text.trim() &&
      !otherTarget?.text.trim()
    )
      return success(null);
    const label = titre ?? '';
    const titleUnit = this.titleUnit(titre, !mapping);
    const unit =
      titleUnit ?? (mapping?.type === 'quantitatif' ? mapping.unite : null);
    const declaredBoolean =
      mapping?.type === 'booleen' || /\(oui\s*\/\s*non\)/i.test(label);
    if (declaredBoolean) {
      const invalidBoolean = [
        result,
        target,
        ...(otherTarget ? [otherTarget] : []),
      ].find(
        (source) =>
          source.text.trim() &&
          !/^(oui|non)(?:\s*\(\d{4}\))?$/i.test(source.text.trim())
      );
      if (invalidBoolean)
        return failure([
          Errors.valueIssue('INVALID_ELECTRIFICATION_BOOLEAN', invalidBoolean),
        ]);
    }
    const numericContext = declaredBoolean ? undefined : valueContext;
    const resultat = this.observation(
      result,
      null,
      label,
      unit,
      numericContext
    );
    const objectif = this.observation(
      target,
      2030,
      label,
      unit,
      numericContext
    );
    const supplement = otherTarget?.text.trim()
      ? this.observation(otherTarget, null, label, unit, numericContext)
      : success(null);
    if (!resultat.success || !objectif.success || !supplement.success)
      return failure([
        ...(!resultat.success ? resultat.error : []),
        ...(!objectif.success ? objectif.error : []),
        ...(!supplement.success ? supplement.error : []),
      ]);
    const base = { source: reference.id, reference: ref, titre };
    const boolean =
      declaredBoolean ||
      typeof resultat.data.value === 'boolean' ||
      typeof objectif.data.value === 'boolean' ||
      typeof supplement.data?.value === 'boolean';
    if (boolean) {
      if (
        [resultat.data.value, objectif.data.value, supplement.data?.value].some(
          (value) => typeof value === 'number'
        ) ||
        resultat.data.unit ||
        objectif.data.unit ||
        supplement.data?.unit
      )
        return failure([
          Errors.valueIssue('INVALID_ELECTRIFICATION_BOOLEAN', result),
        ]);
      return success({
        ...base,
        type: 'booleen',
        resultat: resultat.data.value as boolean | null,
        anneeResultat: resultat.data.year,
        objectif: objectif.data.value as boolean | null,
        anneeObjectif: objectif.data.year,
        ...(supplement.data
          ? {
              objectifComplementaire: {
                valeur: supplement.data.value as boolean | null,
                annee: supplement.data.year,
              },
            }
          : {}),
      });
    }
    const units = [
      titleUnit,
      resultat.data.unit,
      objectif.data.unit,
      supplement.data?.unit ?? null,
    ].filter((unit): unit is string => unit !== null);
    if (new Set([unit, ...units].filter((value) => value !== null)).size > 1)
      return failure([
        Errors.valueIssue('CONFLICTING_INDICATEUR_UNITS', {
          text: [...new Set([unit, ...units].filter(Boolean))].join(' / '),
          location: title.location,
        }),
      ]);
    return success({
      ...base,
      type: 'quantitatif',
      unite: units[0] ?? null,
      periodicite: 'annuelle',
      ...(supplement.data
        ? {
            objectifComplementaire: {
              valeur: supplement.data.value as number | null,
              periode: supplement.data.year?.toString() ?? null,
            },
          }
        : {}),
      resultat: {
        valeur: resultat.data.value as number | null,
        periode: resultat.data.year?.toString() ?? null,
      },
      objectif: {
        valeur: objectif.data.value as number | null,
        periode: objectif.data.year?.toString() ?? null,
      },
    });
  }

  private static titleUnit(
    title: string | null,
    inferCount: boolean
  ): string | null {
    if (title === null) return null;
    const explicit = title
      .match(/\(unit[eé]\s*:\s*([^()]+)\)\s*$/i)?.[1]
      ?.trim();
    if (explicit) return explicit;
    // Un complément comme "(dont précaires)" ne remplace pas l'unité de comptage.
    if (inferCount && /^nombre\s+(?:de\s|d['’])/i.test(title)) return 'Nombre';
    const symbol = title.match(/\(([^()]+)\)\s*$/)?.[1]?.trim();
    return symbol && Values.isUnit(symbol) ? symbol : null;
  }

  private static observation(
    source: Source,
    defaultYear: number | null,
    label: string,
    unit: string | null,
    context?: ElectrificationValueContext
  ): Result<Observation, ElectrificationIssue[]> {
    const request: ElectrificationValueRequest = {
      kind: 'observation',
      source,
      label,
      unit,
      year: defaultYear,
      keys: ['valeur'],
    };
    const text = source.text.trim();
    if (!text) return success({ value: null, year: defaultYear, unit: null });
    if (Values.isApproximate(text))
      return failure([
        Errors.valueIssue('APPROXIMATE_ELECTRIFICATION_VALUE', source),
      ]);
    const date = text.match(/\s*\((\d{4})\)\s*$/);
    const value = date ? text.slice(0, date.index).trim() : text;
    const boolean = Values.normalize(value);
    if (boolean === 'oui' || boolean === 'non') {
      const year = date ? Number(date[1]) : defaultYear;
      if (year === 0 || (date && defaultYear !== null && year !== defaultYear))
        return failure([
          Errors.issue('INVALID_ELECTRIFICATION_INDICATEUR', source.location),
        ]);
      return year === null
        ? failure([Errors.issue('MISSING_INDICATEUR_YEAR', source.location)])
        : success({ value: boolean === 'oui', year, unit: null });
    }
    const values = Interpretation.read(request, context);
    if (!values || values.length !== 1) {
      return failure([
        Errors.issue('INVALID_ELECTRIFICATION_INDICATEUR', source.location),
      ]);
    }
    const parsed = values[0];
    const year = parsed.year ?? defaultYear;
    return year === null
      ? failure([Errors.issue('MISSING_INDICATEUR_YEAR', source.location)])
      : success({ value: parsed.value, year, unit: parsed.unit });
  }
}
