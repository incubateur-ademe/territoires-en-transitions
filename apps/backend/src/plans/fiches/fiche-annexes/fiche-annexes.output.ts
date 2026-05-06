import { annexeDocumentSchema } from '@tet/domain/plans';
import { z } from 'zod';

export const ficheAnnexesOutputSchema = z.array(annexeDocumentSchema);

export type FicheAnnexesOutput = z.infer<typeof ficheAnnexesOutputSchema>;
