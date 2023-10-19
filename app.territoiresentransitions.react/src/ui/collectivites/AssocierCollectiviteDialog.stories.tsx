import {Meta} from '@storybook/react';
import {
  AssocierCollectiviteDialog,
  TAssocierCollectiviteDialogProps,
} from './AssocierCollectiviteDialog';

export default {
  component: AssocierCollectiviteDialog,
} as Meta;

const aucunContactReferentArgs: TAssocierCollectiviteDialogProps = {
  getReferentContacts: async () => [],
};

export const AucunContactReferent = {
  args: aucunContactReferentArgs,
};

const unSeulContactReferentArgs: TAssocierCollectiviteDialogProps = {
  getReferentContacts: async () => [
    {nom: 'Cruze', prenom: 'Tom', email: 'tom@email.fr'},
  ],
};

export const UnSeulContactReferent = {
  args: unSeulContactReferentArgs,
};

const plusieursContactsReferentsArgs: TAssocierCollectiviteDialogProps = {
  getReferentContacts: async () => [
    {nom: 'Cruze', prenom: 'Tom', email: 'tom@email.fr'},
    {nom: 'Canaple', prenom: 'Marie', email: 'marie@email.fr'},
  ],
};

export const PlusieursContactsReferents = {
  args: plusieursContactsReferentsArgs,
};
