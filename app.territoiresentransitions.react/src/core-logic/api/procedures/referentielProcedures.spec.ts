import {
  actionContexte,
  ActionContexte,
  actionDownToTache,
  actionExemples,
  ActionExemples,
  actionPerimetreEvaluation,
  actionReductionPotentiel,
  actionRessources,
  ActionRessources,
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
      children: ['eci_1.3', 'eci_1.1', 'eci_1.2'],
      depth: 1,
      type: 'axe',
      identifiant: '1',
    };
    const partialAction: Partial<ActionDefinitionSummary> = {
      id: 'eci_1.1',
      referentiel: 'eci',
      children: [
        'eci_1.1.2',
        'eci_1.1.1',
        'eci_1.1.5',
        'eci_1.1.4',
        'eci_1.1.3',
      ],
      depth: 2,
      type: 'action',
      identifiant: '1.1',
    };
    const procedureResponse = await referentielDownToAction('eci');
    console.log('procedureResponse ', procedureResponse);

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
      children: [
        'eci_1.1.1.4',
        'eci_1.1.1.5',
        'eci_1.1.1.1',
        'eci_1.1.1.2',
        'eci_1.1.1.3',
      ],
      depth: 3,
      type: 'sous-action',
      identifiant: '1.1.1',
    };
    const partialTache: Partial<ActionDefinitionSummary> = {
      id: 'eci_1.1.1.1',
      referentiel: 'eci',
      children: [],
      depth: 4,
      type: 'tache',
      identifiant: '1.1.1.1',
    };

    const procedureResponse = await actionDownToTache('eci', '1.1.1');

    expect(procedureResponse).toHaveLength(6);
    expect(procedureResponse).toEqual(
      expect.arrayContaining([
        expect.objectContaining(partialAction),
        expect.objectContaining(partialTache),
      ])
    );
  });
});

describe('Retrieve exemples', () => {
  it('should return the action exemples content', async () => {
    const partialExemple: Partial<ActionExemples> = {
      id: 'eci_1.1.1',
    };
    const procedureResponse = await actionExemples('eci_1.1.1');

    expect(procedureResponse).toEqual(expect.objectContaining(partialExemple));
  });
});

describe('Retrieve contexte', () => {
  it('should return the action contexte content', async () => {
    const partialContext: Partial<ActionContexte> = {
      id: 'eci_2.2',
    };
    const procedureResponse = await actionContexte('eci_2.2');

    expect(procedureResponse).toEqual(expect.objectContaining(partialContext));
    expect(procedureResponse.contexte.length).toBeGreaterThan(0);
  });
});

describe('Retrieve ressources', () => {
  it('should return the action ressources content', async () => {
    const partialRessources: Partial<ActionRessources> = {
      id: 'eci_2.2',
    };
    const procedureResponse = await actionRessources('eci_2.2');

    expect(procedureResponse).toEqual(
      expect.objectContaining(partialRessources)
    );
    expect(procedureResponse.ressources.length).toBeGreaterThan(0);
  });
});

describe('Retrieve perimetre evaluation', () => {
  it('should return some content for action cae_1.1.1', async () => {
    const procedureResponse = await actionPerimetreEvaluation('cae_1.1.1');
    expect(procedureResponse.perimetre_evaluation.length).toBeGreaterThan(0);
  });
});

describe('Retrieve reduction potentiel', () => {
  it('should return some content for action cae_1.1.1', async () => {
    const procedureResponse = await actionReductionPotentiel('cae_1.1.1');
    expect(procedureResponse.reduction_potentiel.length).toBeGreaterThan(0);
  });
});
