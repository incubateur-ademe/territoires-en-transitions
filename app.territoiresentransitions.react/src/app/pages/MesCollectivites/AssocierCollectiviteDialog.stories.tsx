import {Story, Meta} from '@storybook/react';
import {
  AssocierCollectiviteDialog,
  TAssocierCollectiviteDialogProps,
} from './AssocierCollectiviteDialog';

export default {
  component: AssocierCollectiviteDialog,
} as Meta;

const Template: Story<TAssocierCollectiviteDialogProps> = args => (
  <AssocierCollectiviteDialog {...args} />
);

export const AucunContactReferent = Template.bind({});
const aucunContactReferentArgs: TAssocierCollectiviteDialogProps = {
  getReferentContacts: async () => [],
};
AucunContactReferent.args = aucunContactReferentArgs;

export const UnSeulContactReferent = Template.bind({});
const unSeulContactReferentArgs: TAssocierCollectiviteDialogProps = {
  getReferentContacts: async () => [
    {nom: 'Cruze', prenom: 'Tom', email: 'tom@email.fr'},
  ],
};
UnSeulContactReferent.args = unSeulContactReferentArgs;

export const PlusieursContactsReferents = Template.bind({});
const plusieursContactsReferentsArgs: TAssocierCollectiviteDialogProps = {
  getReferentContacts: async () => [
    {nom: 'Cruze', prenom: 'Tom', email: 'tom@email.fr'},
    {nom: 'Canaple', prenom: 'Marie', email: 'marie@email.fr'},
  ],
};
PlusieursContactsReferents.args = plusieursContactsReferentsArgs;
