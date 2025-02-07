/**
 * Configuration de la pré-visualisation des composants
 */
import { QueryClient, QueryClientProvider } from 'react-query';
import { UserProvider } from '../src/users/user-provider';
import StoryRouter from './storyRouterDecorator';

// charge les styles de l'appli
import '../src/css';

// pour faire fonctionner storybook avec react-query et notre contexte d'auth.
const queryClient = new QueryClient();
const mockAuthState = {
  user: null,
};
export const decorators = [
  // pour faire fonctionner storybook avec react-router
  StoryRouter(),
  // et avec react-query
  (Story) => (
    <QueryClientProvider client={queryClient}>
      <UserProvider value={mockAuthState}>
        <Story />
      </UserProvider>
    </QueryClientProvider>
  ),
];

// configuration
export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
