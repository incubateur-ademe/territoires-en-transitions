import { Meta} from '@storybook/react';
import {ActionPhaseBadge} from './ActionPhaseBadge';

export default {
  component: ActionPhaseBadge,
} as Meta;

export const Bases = {
  args: {
    action: {phase: 'bases'},
  },
};

export const MiseEnOeuvre = {
  args: {
    action: {phase: 'mise en œuvre'},
  },
};

export const Effets = {
  args: {
    action: {phase: 'effets'},
  },
};
