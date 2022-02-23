import {Story, Meta} from '@storybook/react';
// eslint-disable-next-line node/no-unpublished-import
import {action} from '@storybook/addon-actions';
import {AddPreuve, TAddPreuveProps} from './AddPreuve';

// Après un délai, applique une action et renvoi une promesse résolue avec la
// réponse donnée.
const delayedAction =
  (act, reply, delay = 500) =>
  (...args) =>
    new Promise(resolve =>
      setTimeout(() => {
        act(...args);
        resolve(reply);
      }, delay)
    );

const DEFAULT_ARGS = {
  action: {id: '"eci_1.1.2'},
};
export default {
  component: AddPreuve,
  args: DEFAULT_ARGS,
} as Meta;

const Template: Story<TAddPreuveProps> = args => <AddPreuve {...args} />;

//export const Lien = Template.bind({});
// Lien.parameters = {storyshots: false}; // désactive le storyshot à cause d'un pb dans react-dsfr <File> (?)

export const Fichier = Template.bind({});
Fichier.args = {
  ...DEFAULT_ARGS,
};
Fichier.parameters = {storyshots: false}; // désactive le storyshot à cause d'un pb dans react-dsfr <File> (?)

export const Bibliotheque = Template.bind({});
Bibliotheque.args = {
  ...DEFAULT_ARGS,
  defaultActiveTab: 1,
};
Bibliotheque.parameters = {storyshots: false}; // désactive le storyshot à cause d'un pb dans react-dsfr <File> (?)
