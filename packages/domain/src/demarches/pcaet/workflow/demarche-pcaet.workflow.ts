import { createWorkflow } from '../../../utils/workflow/create-workflow';
import type { DemarchePcaetStatus } from '../demarche-pcaet-status.enum.schema';
import { DEMARCHE_PCAET_INITIAL_STATUS } from './demarche-pcaet-state';
import type { DemarchePcaetGuardId } from './guards/demarche-pcaet-guard.types';
import { DEMARCHE_PCAET_TRANSITIONS } from './transitions/demarche-pcaet.transitions';
import type { DemarchePcaetTransition } from './transitions/demarche-pcaet-transition.enum';

/**
 * Le workflow du dépôt PCAET : un seul cycle de vie, dont la mise à disposition
 * du public est une étape.
 *
 * Les appelants passent par les fonctions nommées de
 * `demarche-pcaet-workflow.facade` plutôt que par cet objet.
 */
export const demarchePcaetWorkflow = createWorkflow<
  DemarchePcaetStatus,
  DemarchePcaetTransition,
  DemarchePcaetGuardId
>({
  initialStatus: DEMARCHE_PCAET_INITIAL_STATUS,
  transitions: DEMARCHE_PCAET_TRANSITIONS,
});
