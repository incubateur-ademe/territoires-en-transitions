import {Story, Meta} from '@storybook/react';
import {
  RejoindreCetteCollectiviteDialog,
  TRejoindreCetteCollectiviteDialogProps,
} from './RejoindreCetteCollectiviteDialog';

export default {
  component: RejoindreCetteCollectiviteDialog,
} as Meta;

const Template: Story<TRejoindreCetteCollectiviteDialogProps> = args => (
  <RejoindreCetteCollectiviteDialog {...args} />
);

export const AucunContactReferent = Template.bind({});
const aucunContactReferentArgs: TRejoindreCetteCollectiviteDialogProps = {
  collectivite: {id: 1, nom: 'Nantes métropole'},
  getReferentContacts: async () => [],
};
AucunContactReferent.args = aucunContactReferentArgs;

export const UnSeulContactReferent = Template.bind({});
const unSeulContactReferentArgs: TRejoindreCetteCollectiviteDialogProps = {
  collectivite: {id: 1, nom: 'Nantes métropole'},
  getReferentContacts: async () => [
    {nom: 'Cruze', prenom: 'Tom', email: 'tom@email.fr'},
  ],
};
UnSeulContactReferent.args = unSeulContactReferentArgs;

export const PlusieursContactsReferents = Template.bind({});
const plusieursContactsReferentsArgs: TRejoindreCetteCollectiviteDialogProps = {
  collectivite: {id: 1, nom: 'Nantes métropole'},
  getReferentContacts: async () => [
    {nom: 'Cruze', prenom: 'Tom', email: 'tom@email.fr'},
    {nom: 'Canaple', prenom: 'Marie', email: 'marie@email.fr'},
  ],
};
PlusieursContactsReferents.args = plusieursContactsReferentsArgs;
