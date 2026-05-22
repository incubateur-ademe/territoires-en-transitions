import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import RichTextEditor from './RichTextEditor';

const meta: Meta<typeof RichTextEditor> = {
  component: RichTextEditor,
  args: {
    onChange: action('onChange'),
  },
};

export default meta;

type Story = StoryObj<typeof RichTextEditor>;

export const Default: Story = {};
export const IsLoading: Story = {
  args: {
    isLoading: true,
  },
};

export const AvecContenuInitialMarkdown: Story = {
  args: {
    initialValue: `
Texte en **gras**, *italique*, <u>souligné</u>,

Liste :
- Item 1
- Item 2

- Item 3
- Item 4 avec un lien https://ademe.fr`,
  },
};

export const AvecContenuInitialHTML: Story = {
  args: {
    initialValue: `
      <p>
        Texte en <strong>gras</strong>, <em>italique</em>, <u>souligné</u>,
        <span data-text-color="red">couleur</span>,
        <span data-background-color="yellow">sur fond de couleur</span>
      </p>
      <p>Liste à puces :</p>
      <ul>
        <li><p>item 1</p></li>
        <li><p>item 2</p></li>
      </ul>
      <p>Liste numérotée</p>
      <ol>
        <li><p>item A</p></li>
        <li><p>item B</p></li>
      </ol>
      <p>
        <a target="_blank" rel="noopener noreferrer nofollow" href="https://ademe.fr/"
          >Lien</a
        >
      </p>
      <p></p>
      <p data-text-alignment="center">Aligné au centre</p>
      <p data-text-alignment="right">Aligné au droite</p>
      <p data-text-alignment="justify"><strong>Justifié</strong> : Donec libero. Quisque vitae est quis dui bibendum suscipit. Fusce leo felis, sagittis non, vehicula ac, ultricies vitae, diam. Aenean congue libero et metus. Nulla convallis libero a lacus. Donec hendrerit lorem sit amet leo. Mauris libero. Pellentesque pulvinar molestie dolor. Proin nibh mauris, ornare at, pretium sit amet, porttitor vel, mi. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.</p>
  `,
  },
};

export const AvecContenuInitialTextePlatBdd: Story = {
  args: {
    initialValue: `SYNTHESE
La CCPA accompagnement les entreprises notamment via :
-Sa convention avec la CMA : diagnostics transition écologique / éclairage
-Ses actions sur la qualité des ZAE : participation du CAUE en cours de lancement
-Ses actions contre la vacance commerciale : subventionnement des travaux avec priorité aux travaux énergétique
L'ALTE est aussi présente sur le territoire et conseille le petit tertiaire (pas de CR détaillé à la CCPA)
La CCPA suit précisément les actions qu'elle a mises en oeuvre (nombre de diagnostics, travaux réalisés, chiffrage des économies…)`,
  },
};

export const EnLectureSeule: Story = {
  args: {
    initialValue: 'Contenu en <b>lecture seule</b>',
    disabled: true,
  },
};
