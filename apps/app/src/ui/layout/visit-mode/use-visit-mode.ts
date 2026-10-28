import { useContexteInstructionVisit } from '@/app/demarches/pcaet/instruction/use-contexte-instruction-visit';
import type { VisitMode } from './visit-mode';

/**
 * Les sources de visite se branchent ici. Seule l'instruction PCAET en est une
 * pour l'instant.
 */
export const useVisitMode = (): VisitMode | null =>
  useContexteInstructionVisit();
