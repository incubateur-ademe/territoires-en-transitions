import { ficheClassificationSchema } from './classify-fiche/classify-fiche.schema';

export type ClassificationEnjeu = {
  systemInstruction: string;
  responseSchema: typeof ficheClassificationSchema;
};
