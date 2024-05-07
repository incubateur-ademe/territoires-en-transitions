import React from 'react';
import {Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {ApplyOpenDataModal, Props} from './ApplyOpenDataModal';

export default {
  component: ApplyOpenDataModal,
  args: {
    setOverwrite: action('setOverwrite'),
  },
  render: args => (
    <div className="flex flex-col gap-8">
      <ApplyOpenDataModal {...args} />
    </div>
  ),
} as Meta<Props>;

export const AvecConflits = {
  args: {
    definition: {unite: 'teqCO2'},
    source: {id: 'pcaet', nom: 'PCAET', type: 'objectif'},
    comparaison: {
      conflits: 2,
      lignes: [
        {annee: 2022, valeur: 141_299, nouvelleValeur: 150_000, conflit: true},
        {annee: 2021, valeur: 141_299, nouvelleValeur: 140_000, conflit: true},
      ],
    },
  },
};

export const AvecConflitsEcrasement = {
  args: {...AvecConflits.args, overwrite: true},
};

export const SansConflits = {
  args: {
    definition: {unite: 'teqCO2'},
    source: {id: 'pcaet', nom: 'PCAET', type: 'objectif'},
    comparaison: {
      conflits: 0,
      lignes: [
        {
          annee: 2022,
          nouvelleValeur: 141_299,
          conflit: false,
          estNouveau: true,
        },
        {annee: 2021, valeur: 141_299, nouvelleValeur: 141_299, conflit: false},
      ],
    },
  },
};

export const EnConflitPartiel = {
  args: {
    definition: {unite: 'teqCO2'},
    source: {id: 'pcaet', nom: 'PCAET', type: 'objectif'},
    comparaison: {
      conflits: 1,
      lignes: [
        {annee: 2022, valeur: 141_299, nouvelleValeur: 150_000, conflit: true},
        {annee: 2021, valeur: 141_299, nouvelleValeur: 141_299, conflit: false},
      ],
    },
  },
};

export const EnConflitPartielEcrasement = {
  args: {...EnConflitPartiel.args, overwrite: true},
};

export const VarianteResultats = {
  args: {
    definition: {unite: 'teqCO2'},
    source: {id: 'pcaet', nom: 'PCAET', type: 'resultat'},
    comparaison: {
      conflits: 1,
      lignes: [
        {annee: 2022, valeur: 141_299, nouvelleValeur: 150_000, conflit: true},
        {annee: 2021, valeur: 141_299, nouvelleValeur: 141_299, conflit: false},
      ],
    },
  },
};
