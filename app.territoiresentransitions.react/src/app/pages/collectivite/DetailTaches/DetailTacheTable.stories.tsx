import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {TacheDetail} from './useDetailTache';
import {DetailTacheTable, TDetailTacheTableProps} from './DetailTacheTable';
import fixture from './fixture.json';

const all = fixture as TacheDetail[];

export default {
  component: DetailTacheTable,
} as Meta;

const fetchChildren = (parentId: string): Promise<TacheDetail[]> => {
  action('fetchChildren')(parentId);

  const row = all.find(({action_id}) => action_id === parentId);
  const nextDepth = row.depth + 1;

  return Promise.resolve(
    all.filter(
      ({action_id, depth}) =>
        depth === nextDepth && action_id.startsWith(parentId)
    )
  );
};

const Template: Story<TDetailTacheTableProps> = args => (
  <DetailTacheTable
    updateActionStatut={action('updateActionStatut')}
    fetchChildren={fetchChildren}
    {...args}
  />
);

const firstLevel = all.filter(({depth}) => depth === 1);

export const Niveau1 = Template.bind({});
Niveau1.args = {
  taches: firstLevel,
};
