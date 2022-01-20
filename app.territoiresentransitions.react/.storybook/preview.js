/**
 * Configuration de la pré-visualisation des composants
 */
import {addDecorator} from '@storybook/react';
import StoryRouter from 'storybook-react-router';

// charge les styles de l'appli
import '../src/css/tailwind.css';
import '../src/css/app.css';

// pour faire fonctionner storybook avec react-router
addDecorator(StoryRouter());

// configuration
export const parameters = {
  actions: {argTypesRegex: '^on[A-Z].*'},
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
