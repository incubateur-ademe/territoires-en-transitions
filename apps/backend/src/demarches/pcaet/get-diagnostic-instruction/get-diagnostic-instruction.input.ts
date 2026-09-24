import { dossierInstructionRefSchema } from '../shared/dossier-instruction-ref.input';

export const getDiagnosticInstructionInputSchema = dossierInstructionRefSchema;

export type GetDiagnosticInstructionInput =
  typeof getDiagnosticInstructionInputSchema._output;
