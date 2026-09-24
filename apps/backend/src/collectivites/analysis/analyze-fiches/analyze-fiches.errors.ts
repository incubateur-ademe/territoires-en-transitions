import { createEnumObject } from '@tet/domain/utils';
import { type VoletError } from '../volet.errors';
import { RunAborted } from './add-run-failures.rules';

const ficheCandidateErrorValues = ['LIST_FICHE_CANDIDATES_ERROR'] as const;

export const FicheCandidateErrorEnum = createEnumObject(
  ficheCandidateErrorValues
);

export type FicheCandidateError = (typeof ficheCandidateErrorValues)[number];

const ficheTextErrorValues = ['LIST_FICHE_TEXTS_ERROR'] as const;

export const FicheTextErrorEnum = createEnumObject(ficheTextErrorValues);

export type FicheTextError = (typeof ficheTextErrorValues)[number];

const ficheAnalysisStatusErrorValues = [
  'LIST_FICHE_ANALYSES_ERROR',
  'UPSERT_FICHE_ANALYSES_ERROR',
  'DELETE_FICHE_ANALYSES_ERROR',
] as const;

export const FicheAnalysisStatusErrorEnum = createEnumObject(
  ficheAnalysisStatusErrorValues
);

export type FicheAnalysisStatusError =
  (typeof ficheAnalysisStatusErrorValues)[number];

const analysisRunErrorValues = [
  'GET_LAST_ANALYSIS_RUN_ERROR',
  'CREATE_ANALYSIS_RUN_ERROR',
] as const;

export const AnalysisRunErrorEnum = createEnumObject(analysisRunErrorValues);

export type AnalysisRunError = (typeof analysisRunErrorValues)[number];

export type AnalyzeFichesInputError =
  | { readonly kind: 'unknown_argument'; readonly argument: string }
  | { readonly kind: 'empty_collectivites' }
  | { readonly kind: 'invalid_collectivite_id'; readonly value: string };

export type AnalyzeFichesError =
  | RunAborted
  | {
      readonly kind: 'step_failed';
      readonly step: 'get_last_run' | 'create_run';
      readonly cause: AnalysisRunError;
    }
  | {
      readonly kind: 'step_failed';
      readonly step: 'list_fiche_candidates';
      readonly cause: FicheCandidateError;
    }
  | {
      readonly kind: 'step_failed';
      readonly step: 'list_fiche_texts';
      readonly cause: FicheTextError;
    }
  | {
      readonly kind: 'step_failed';
      readonly step: 'list_analyses' | 'upsert_analyses' | 'delete_analyses';
      readonly cause: FicheAnalysisStatusError;
    }
  | {
      readonly kind: 'step_failed';
      readonly step:
        | 'save_volets'
        | 'list_volets'
        | 'delete_volets'
        | 'list_mobilisations'
        | 'update_mobilisation';
      readonly cause: VoletError;
    };
