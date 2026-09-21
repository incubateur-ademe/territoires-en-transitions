import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { FicheVolet } from '../pipeline/calculate-mobilisation/group-volets-by-levier';
import { FicheToScore } from '../pipeline/calculate-mobilisation/render-volet-actions';
import { ClassificationDraft } from './classification-draft';

export type ClassificationOutcome = {
  draft: ClassificationDraft;
  fiches: FicheToScore[];
  volets: FicheVolet[];
  tokens: TokenUsage;
};
