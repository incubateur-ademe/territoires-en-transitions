import {Meta} from '@storybook/nextjs-vite';
import {ZxcvbnResult} from '@zxcvbn-ts/core';
import {PasswordStrengthMeter} from './PasswordStrengthMeter';

const meta: Meta<typeof PasswordStrengthMeter> = {
  component: PasswordStrengthMeter,
};

export default meta;

const feedback = {
  warning:
    'Les lignes droites de touches de votre clavier sont faciles à deviner',
  suggestions: [
    'Évitez les séquences de caractères courantes.',
    "Évitez les substitutions de lettres prévisibles comme '@' pour 'a'.",
  ],
};

export const Nul = () => (
  <PasswordStrengthMeter strength={{score: 0, feedback} as ZxcvbnResult} />
);

export const Faible = () => (
  <PasswordStrengthMeter strength={{score: 1, feedback} as ZxcvbnResult} />
);

export const Passable = () => (
  <PasswordStrengthMeter strength={{score: 2, feedback} as ZxcvbnResult} />
);

export const Bon = () => (
  <PasswordStrengthMeter strength={{score: 3} as ZxcvbnResult} />
);

export const Robuste = () => (
  <PasswordStrengthMeter strength={{score: 4} as ZxcvbnResult} />
);
