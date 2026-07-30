import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ProConnectButton } from './ProConnectButton';

/**
 * Bouton de connexion ProConnect : écran de login, inscription, et liaison
 * d'identité depuis le profil. Le balisage suit le DSFR ; MonCompteAdeme est
 * présenté avec ce même bouton, sans variante dédiée.
 */
const meta: Meta<typeof ProConnectButton> = {
  component: ProConnectButton,
};

export default meta;

type Story = StoryObj<typeof ProConnectButton>;

/**
 * Bouton par défaut. L'`url` pointe vers l'endpoint de connexion OIDC du
 * backend en usage réel ; ici une URL d'exemple neutre pour éviter que la story
 * ne déclenche un vrai parcours OIDC au clic.
 */
export const Bouton: Story = {
  args: {
    url: 'https://fournisseur-oidc.example/login',
  },
};

/** Bouton déclenchant un gestionnaire personnalisé plutôt qu'une navigation. */
export const BoutonAvecOnClick: Story = {
  args: {
    onClick: () => alert('Connexion ProConnect déclenchée'),
  },
};
