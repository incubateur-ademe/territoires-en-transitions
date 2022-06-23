/**
 * Configuration de la pré-visualisation des composants
 */
import {addDecorator} from '@storybook/react';
import StoryRouter from 'storybook-react-router';
import {QueryClient, QueryClientProvider} from 'react-query';
import {defaults} from 'react-chartjs-2';

defaults.font = {...defaults.font, family: 'Marianne', size: 14};

// charge les styles de l'appli
import '../src/css/tailwind.css';
import '../src/css/app.css';

// pour faire fonctionner storybook avec react-router
addDecorator(StoryRouter());

// pour faire fonctionner storybook avec react-query
const queryClient = new QueryClient();
export const decorators = [
  Story => (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  ),
];

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
