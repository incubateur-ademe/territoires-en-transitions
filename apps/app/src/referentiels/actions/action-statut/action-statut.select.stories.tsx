import { Meta, StoryFn } from '@storybook/nextjs';
import {
  DEFAULT_OPTIONS_WITH_NON_CONCERNE,
  SelectActionStatut,
  TSelectActionStatutProps,
} from './action-statut.select';

export default {
  component: SelectActionStatut,
} as Meta;

const Template: StoryFn<TSelectActionStatutProps> = (args) => (
  <div style={{ width: 200 }}>
    <SelectActionStatut {...args} />
  </div>
);

export const SelectionParDefaut = {
  render: Template,
};

export const AvecSelection = {
  render: Template,

  args: {
    value: 'fait',
  },
};

export const AvecNonConcerne = {
  render: Template,

  args: {
    value: 'non_concerne',
    items: DEFAULT_OPTIONS_WITH_NON_CONCERNE,
  },
};
