import { PlanType } from '@tet/domain/plans';
import { planTypesToOptions } from './plan-types-to-options';

const planTypesFromBackend: PlanType[] = [
  { id: 14, categorie: 'Plans thématiques', type: 'Autre thématique', detail: null },
  { id: 8, categorie: 'Plans thématiques', type: 'Plan Energies', detail: 'dont TEPOS' },
  { id: 6, categorie: 'Plans transverses', type: 'Autre transverse', detail: null },
  {
    id: 1,
    categorie: 'Plans transverses',
    type: 'Projet de Territoire',
    detail: 'dont Agenda 2030',
  },
];

describe('planTypesToOptions', () => {
  it('place la section "Plans transverses" avant "Plans thématiques"', () => {
    const titles = planTypesToOptions(planTypesFromBackend).map(
      (section) => section.title
    );
    expect(titles).toEqual(['Plans transverses', 'Plans thématiques']);
  });

  it('place les options "Autre" en fin de chaque section', () => {
    const lastLabelOfEachSection = planTypesToOptions(planTypesFromBackend).map(
      (section) => section.options[section.options.length - 1].label
    );
    expect(lastLabelOfEachSection).toEqual([
      'Autre transverse',
      'Autre thématique',
    ]);
  });

  it('formate le label avec le détail entre parenthèses', () => {
    expect(planTypesToOptions(planTypesFromBackend)).toEqual([
      {
        title: 'Plans transverses',
        options: [
          { value: 1, label: 'Projet de Territoire (dont Agenda 2030)' },
          { value: 6, label: 'Autre transverse' },
        ],
      },
      {
        title: 'Plans thématiques',
        options: [
          { value: 8, label: 'Plan Energies (dont TEPOS)' },
          { value: 14, label: 'Autre thématique' },
        ],
      },
    ]);
  });
});
