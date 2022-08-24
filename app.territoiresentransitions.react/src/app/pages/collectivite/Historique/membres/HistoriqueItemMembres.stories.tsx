import React from 'react';
import {Story, Meta} from '@storybook/react';

import HistoriqueItemMembres from './HistoriqueItemMembres';
import {THistoriqueItemProps} from './fakeTypes';
import {
  fakeMembreAjouteHistorique,
  fakeMembreRetireHistorique,
  fakeMembreAjoutFonctionHistorique,
  fakeMembreModifieFonctionHistorique,
  fakeMembreAjoutChampInterventionHistorique,
  fakeMembreModifieChampInterventionHistorique,
  fakeMembreAjoutDetailsFonctionHistorique,
  fakeMembreModifieDetailsFonctionHistorique,
  fakeMembreModifieAccesHistorique,
} from './fixture';

export default {
  component: HistoriqueItemMembres,
} as Meta;

const Template: Story<THistoriqueItemProps> = args => (
  <HistoriqueItemMembres {...args} />
);

export const MembreAjoute = Template.bind({});
const membreAjouteArgs: THistoriqueItemProps = {
  item: fakeMembreAjouteHistorique,
};
MembreAjoute.args = membreAjouteArgs;

export const MembreRetire = Template.bind({});
const membreRetireArgs: THistoriqueItemProps = {
  item: fakeMembreRetireHistorique,
};
MembreRetire.args = membreRetireArgs;

export const MembreAjoutFonction = Template.bind({});
const membreAjoutFonctionArgs: THistoriqueItemProps = {
  item: fakeMembreAjoutFonctionHistorique,
};
MembreAjoutFonction.args = membreAjoutFonctionArgs;

export const MembreModifieFonction = Template.bind({});
const membreModifieFonctionArgs: THistoriqueItemProps = {
  item: fakeMembreModifieFonctionHistorique,
};
MembreModifieFonction.args = membreModifieFonctionArgs;

export const MembreAjoutChampIntervention = Template.bind({});
const membreAjoutChampInterventionArgs: THistoriqueItemProps = {
  item: fakeMembreAjoutChampInterventionHistorique,
};
MembreAjoutChampIntervention.args = membreAjoutChampInterventionArgs;

export const MembreModifieChampIntervention = Template.bind({});
const membreModifieChampInterventionArgs: THistoriqueItemProps = {
  item: fakeMembreModifieChampInterventionHistorique,
};
MembreModifieChampIntervention.args = membreModifieChampInterventionArgs;

export const MembreAjoutDetailsFonction = Template.bind({});
const membreAjoutDetailsFonctionArgs: THistoriqueItemProps = {
  item: fakeMembreAjoutDetailsFonctionHistorique,
};
MembreAjoutDetailsFonction.args = membreAjoutDetailsFonctionArgs;

export const MembreModifieDetailsFonction = Template.bind({});
const membreModifieDetailsFonctionsArgs: THistoriqueItemProps = {
  item: fakeMembreModifieDetailsFonctionHistorique,
};
MembreModifieDetailsFonction.args = membreModifieDetailsFonctionsArgs;

export const MembreModifieAcces = Template.bind({});
const membreModifieAccesArgs: THistoriqueItemProps = {
  item: fakeMembreModifieAccesHistorique,
};
MembreModifieAcces.args = membreModifieAccesArgs;
