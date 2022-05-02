import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {ResourceManager, TResourceManagerProps} from './index';

const DEFAULT_ARGS = {
  onClose: action('onClose'),
  handlers: {
    addFileFromLib: action('addFileFromLib'),
    addLink: action('addLink'),
  },
};
export default {
  component: ResourceManager,
  args: DEFAULT_ARGS,
} as Meta;

const Template: Story<TResourceManagerProps> = args => (
  <ResourceManager {...args} />
);

export const Lien = Template.bind({});
Lien.parameters = {storyshots: false}; // désactive le storyshot à cause d'un pb dans react-dsfr <File> (?)

export const Fichier = Template.bind({});
Fichier.args = {
  ...DEFAULT_ARGS,
  defaultActiveTab: 1,
};
Fichier.parameters = {storyshots: false}; // désactive le storyshot à cause d'un pb dans react-dsfr <File> (?)

export const Bibliotheque = Template.bind({});
Bibliotheque.args = {
  ...DEFAULT_ARGS,
  defaultActiveTab: 2,
};
Bibliotheque.parameters = {storyshots: false}; // désactive le storyshot à cause d'un pb dans react-dsfr <File> (?)
