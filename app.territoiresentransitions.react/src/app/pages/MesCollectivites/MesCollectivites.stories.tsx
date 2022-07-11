import {Story, Meta} from '@storybook/react';

import {MesCollectivites, TMesCollectivitesProps} from './MesCollectivites';

const Template: Story<TMesCollectivitesProps> = args => (
  <MesCollectivites {...args} />
);

export default {
  component: MesCollectivites,
} as Meta;

export const Exemple1Item = Template.bind({});
Exemple1Item.args = {
  ownedCollectivites: [{collectivite_id: 104, nom: 'Ardenne Métropole'}],
};

export const Exemple2Items = Template.bind({});
Exemple2Items.args = {
  ownedCollectivites: [
    {collectivite_id: 104, nom: 'Ardenne Métropole'},
    {collectivite_id: 513, nom: 'Bordeaux Métropole'},
  ],
};

export const Exemple3Items = Template.bind({});
Exemple3Items.args = {
  ownedCollectivites: [
    {collectivite_id: 104, nom: 'Ardenne Métropole'},
    {collectivite_id: 513, nom: 'Bordeaux Métropole'},
    {collectivite_id: 1575, nom: 'Boucle Nord de Seine'},
  ],
};

export const Exemple4Items = Template.bind({});
Exemple4Items.args = {
  ownedCollectivites: [
    {collectivite_id: 104, nom: 'Ardenne Métropole'},
    {collectivite_id: 513, nom: 'Bordeaux Métropole'},
    {collectivite_id: 1575, nom: 'Boucle Nord de Seine'},
    {collectivite_id: 400, nom: 'Brest Métropole'},
  ],
};
