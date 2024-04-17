import {Meta, StoryObj} from '@storybook/react';
import {FilterPAI} from './FilterPAI';
import {useState} from 'react';
import {OptionValue} from '@design-system/Select';

const meta: Meta<typeof FilterPAI> = {
  title: 'Components/Filters/Filter PAI',
  component: FilterPAI,
};

export default meta;

type Story = StoryObj<typeof FilterPAI>;

export const Default: Story = {
  render: args => {
    const [thematiquesValues, setThematiquesValues] = useState<
      OptionValue[] | undefined
    >();
    const [budgetsValues, setBudgetsValues] = useState<
      OptionValue[] | undefined
    >();
    const [tempsValues, setTempsValues] = useState<OptionValue[] | undefined>();

    return (
      <div className="mb-96">
        <FilterPAI
          {...args}
          thematiques={{
            titre: 'Thématiques',
            options: [
              {value: 1, label: 'Thématique 1'},
              {value: 2, label: 'Thématique 2'},
              {value: 3, label: 'Thématique 3'},
            ],
            values: thematiquesValues,
            onChange: ({values}) => setThematiquesValues(values),
          }}
          budgets={{
            titre: 'Ordre de grandeur budgétaire',
            options: [
              {value: 1, label: 'Budget 1'},
              {value: 2, label: 'Budget 2'},
            ],
            values: budgetsValues,
            onChange: ({values}) => setBudgetsValues(values),
          }}
          temps={{
            titre: 'Temps de mise en oeuvre',
            options: [
              {value: 1, label: 'Temps 1'},
              {value: 2, label: 'Temps 2'},
            ],
            values: tempsValues,
            onChange: ({values}) => setTempsValues(values),
          }}
        />
      </div>
    );
  },
};
