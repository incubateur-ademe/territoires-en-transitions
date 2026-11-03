import { Enjeu } from '@tet/domain/shared';
import { ClassificationEnjeu } from './pipeline/classification-enjeu';
import { FICHE_CLASSIFICATION_SYSTEM_INSTRUCTION } from './pipeline/classify-fiche/classify-fiche.prompt';
import { ficheClassificationSchema } from './pipeline/classify-fiche/classify-fiche.schema';

export const ENJEU_GES: ClassificationEnjeu = {
  systemInstruction: FICHE_CLASSIFICATION_SYSTEM_INSTRUCTION,
  responseSchema: ficheClassificationSchema,
};

export const DECLARED_ENJEUX = {
  ges: ENJEU_GES,
} satisfies Record<Enjeu, ClassificationEnjeu>;

export const isDeclaredEnjeu = (value: string): value is Enjeu =>
  value in DECLARED_ENJEUX;
