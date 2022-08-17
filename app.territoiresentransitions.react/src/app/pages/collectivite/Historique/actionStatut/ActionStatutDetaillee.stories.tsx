import React from 'react';
import {
  PrecedenteActionStatutDetaille,
  NouvelleActionStatutDetaille,
} from './ActionStatutDetaillee';

export default {
  component: NouvelleActionStatutDetaille,
};

export const ActionPrecedente = () => (
  <PrecedenteActionStatutDetaille avancementDetaille={[0.1, 0, 0]} />
);
export const ActionNouvelle = () => (
  <NouvelleActionStatutDetaille avancementDetaille={[0.2, 0.3, 0.5]} />
);
