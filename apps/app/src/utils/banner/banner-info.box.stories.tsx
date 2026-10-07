import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BannerInfoBox } from './banner-info.box';

const meta: Meta<typeof BannerInfoBox> = {
  title: 'Utils/BannerInfoBox',
  component: BannerInfoBox,
};

export default meta;

type Story = StoryObj<typeof BannerInfoBox>;

const HTML =
  '<p>Une <strong>maintenance</strong> est prévue mardi 25 août de 8h à 10h. <a href="https://territoiresentransitions.fr" target="_blank">En savoir plus</a></p>';

const HTML_PLUSIEURS_LIGNES =
  '<p>Une <strong>maintenance</strong> est prévue mardi 25 août de 8h à 10h. Les référentiels, les plans d\'action et les indicateurs resteront consultables, mais aucune modification ne sera enregistrée pendant toute la durée de l\'intervention. Nous vous invitons à sauvegarder vos travaux en cours avant le début de la plage horaire. <a href="https://territoiresentransitions.fr" target="_blank">En savoir plus</a></p>';

export const Info: Story = {
  args: { type: 'info', html: HTML, onDismiss: () => undefined },
};

export const Warning: Story = {
  args: { type: 'warning', html: HTML, onDismiss: () => undefined },
};

export const Erreur: Story = {
  args: { type: 'error', html: HTML, onDismiss: () => undefined },
};

export const PlusieursLignes: Story = {
  args: {
    type: 'info',
    html: HTML_PLUSIEURS_LIGNES,
    onDismiss: () => undefined,
  },
};

export const SansFermeture: Story = {
  args: { type: 'info', html: HTML },
};
