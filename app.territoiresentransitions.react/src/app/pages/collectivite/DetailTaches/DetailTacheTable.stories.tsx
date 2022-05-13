import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {DetailTacheTable, TDetailTacheTableProps} from './DetailTacheTable';
import fixture from './fixture.json';

export default {
  component: DetailTacheTable,
} as Meta;

const fetchChildren = (
  action_id: string,
  depth: number
): Promise<
  {
    identifiant: string;
    nom: string;
    avancement: string;
    have_children: boolean;
    depth: number;
  }[]
> =>
  Promise.resolve(
    fixture.filter(
      ({depth: d, action_id: a}) => d === depth && a.startsWith(action_id)
    )
  );

const Template: Story<TDetailTacheTableProps> = args => (
  <DetailTacheTable
    updateActionStatut={action('updateActionStatut')}
    fetchChildren={fetchChildren}
    {...args}
  />
);

const firstLevel = fixture.filter(({depth}) => depth === 1);

export const Niveau1 = Template.bind({});
Niveau1.args = {
  taches: firstLevel,
};
