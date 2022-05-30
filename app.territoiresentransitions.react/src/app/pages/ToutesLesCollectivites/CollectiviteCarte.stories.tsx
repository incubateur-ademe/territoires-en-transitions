import {Story, Meta} from '@storybook/react';
import {TCollectiviteCarteProps, CollectiviteCarte} from './CollectiviteCarte';

export default {
  component: CollectiviteCarte,
} as Meta;

const Template: Story<TCollectiviteCarteProps> = args => (
  <ul>
    <CollectiviteCarte {...args} />
  </ul>
);

export const CarteCollectiviteAuNomCourt = Template.bind({});
CarteCollectiviteAuNomCourt.args = {
  collectivite: {
    collectivite_id: 2,
    nom: 'Ploemeur',
    type_collectivite: 'commune',
    code_siren_insee: 56162,
    region_code: 56270,
    departement_code: 29,
    population: 10000,
    etoiles_cae: 3,
    etoiles_eci: 0,
    score_fait_cae: 0,
    score_fait_eci: 0,
    score_programme_cae: 0.51,
    score_programme_eci: 0.1,
    completude_cae: 1,
    completude_eci: 0,
  },
};

export const CarteCollectiviteAuNomLong = Template.bind({});
CarteCollectiviteAuNomLong.args = {
  collectivite: {
    collectivite_id: 3,
    nom: "SI de l'Entre-deux-Mers Ouest pour la collecte et le traitement des ordures ménagères (SEMOCTOM)",
    type_collectivite: 'commune',
    code_siren_insee: 56162,
    region_code: 56270,
    departement_code: 29,
    population: 10000,
    etoiles_cae: 1,
    etoiles_eci: 1,
    score_fait_cae: 0.13,
    score_fait_eci: 0.59,
    score_programme_cae: 0.39,
    score_programme_eci: 0.51,
    completude_cae: 1,
    completude_eci: 1,
  },
};

export const CarteCollectiviteSyndicat = Template.bind({});
CarteCollectiviteSyndicat.args = {
  collectivite: {
    collectivite_id: 3,
    nom: 'SYTEVOM SYndicat Transfert Elimination Valorisation des Ordures ménagères',
    type_collectivite: 'syndicat',
    code_siren_insee: 56162,
    region_code: 56270,
    departement_code: 29,
    population: 10000,
    etoiles_cae: 1,
    etoiles_eci: 1,
    score_fait_cae: 0.13,
    score_fait_eci: 0.39,
    score_programme_cae: 0.39,
    score_programme_eci: 0.51,
    completude_cae: 1,
    completude_eci: 1,
  },
};
