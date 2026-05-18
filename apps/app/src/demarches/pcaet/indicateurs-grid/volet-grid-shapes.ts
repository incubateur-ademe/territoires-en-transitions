import type { DemarchePcaetVoletId } from '../demarche-pcaet.types';
import { IndicateurGridShape } from '@/app/indicateurs/valeurs/grid/indicateur-grid-shape';
import { ENR_GRID_SHAPE } from './enr.grid-shape';
import { POLLUANTS_ATMOSPHERIQUES_GRID_SHAPE } from './polluants-atmospheriques.grid-shape';
import { PROFIL_ENERGIE_CLIMAT_GRID_SHAPE } from './profil-energie-climat.grid-shape';
import { SEQUESTRATION_GRID_SHAPE } from './sequestration.grid-shape';

export const VOLET_GRID_SHAPES: Partial<
  Record<DemarchePcaetVoletId, IndicateurGridShape>
> = {
  polluants_atmospheriques: POLLUANTS_ATMOSPHERIQUES_GRID_SHAPE,
  profil_energie_climat: PROFIL_ENERGIE_CLIMAT_GRID_SHAPE,
  sequestration: SEQUESTRATION_GRID_SHAPE,
  enr: ENR_GRID_SHAPE,
};
