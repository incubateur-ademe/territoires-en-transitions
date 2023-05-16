import {
  actionDownToTache,
  referentielDownToAction,
} from 'core-logic/api/procedures/referentielProcedures';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';

describe('Retrieve referentiel down to action', () => {
  it('should return the referentiel content', async () => {
    const partialRoot: Partial<ActionDefinitionSummary> = {
      id: 'eci',
      referentiel: 'eci',
      children: ['eci_2', 'eci_3', 'eci_4', 'eci_1', 'eci_5'],
      depth: 0,
      type: 'referentiel',
      identifiant: '',
      nom: 'Économie Circulaire',
    };
    const partialAxe: Partial<ActionDefinitionSummary> = {
      id: 'eci_1',
      referentiel: 'eci',
      children: ['eci_1.1', 'eci_1.3', 'eci_1.2'],
      depth: 1,
      type: 'axe',
      identifiant: '1',
    };
    const partialAction: Partial<ActionDefinitionSummary> = {
      id: 'eci_1.1',
      referentiel: 'eci',
      depth: 2,
      type: 'action',
      identifiant: '1.1',
    };

    const procedureResponse = await referentielDownToAction('eci');
    expect(procedureResponse).toEqual(
      expect.arrayContaining([
        expect.objectContaining(partialRoot),
        expect.objectContaining(partialAxe),
        expect.objectContaining(partialAction),
      ])
    );
  });
});

describe('Retrieve action down to tache', () => {
  it('should return the action content', async () => {
    const partialAction: Partial<ActionDefinitionSummary> = {
      id: 'eci_1.1.1',
      referentiel: 'eci',
      depth: 3,
      type: 'sous-action',
      identifiant: '1.1.1',
    };
    const partialTache: Partial<ActionDefinitionSummary> = {
      id: 'eci_1.1.1.1',
      referentiel: 'eci',
      depth: 4,
      type: 'tache',
      identifiant: '1.1.1.1',
    };

    const procedureResponse = await actionDownToTache('eci', '1.1.1');

    expect(procedureResponse).toEqual(
      expect.arrayContaining([
        expect.objectContaining(partialAction),
        expect.objectContaining(partialTache),
      ])
    );
  });
});
