import { dossierInstructionRefSchema } from '../shared/dossier-instruction-ref.input';

export const getDossierInstructionInputSchema = dossierInstructionRefSchema;

export type GetDossierInstructionInput = typeof getDossierInstructionInputSchema._output;
