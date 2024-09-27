import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Accordion, AccordionControlled } from './Accordion';
import DoubleCheckIcon from '@tet/ui/assets/DoubleCheckIcon';

const meta: Meta<typeof Accordion> = {
  component: Accordion,
  args: {
    title: 'Titre',
    content: 'contenu',
  },
};

export default meta;

type Story = StoryObj<typeof Accordion>;

export const Default: Story = {};

export const ControlleOuvert = () => (
  <AccordionControlled
    title="Titre"
    content="Contenu"
    expanded
    setExpanded={action('setExpanded')}
  />
);

export const ContenuStyle: Story = {
  args: {
    content: 'Contenu stylé',
    contentClassname: 'border border-dashed',
  },
};

export const ContenuPersonnalise: Story = {
  args: {
    content: <p className="font-bold border p-8">Contenu personnalisé</p>,
  },
};

export const AvecIcone: Story = {
  args: {
    icon: 'information-line',
  },
};

export const AvecIconeADroite: Story = {
  args: {
    icon: 'information-line',
    iconPosition: 'right',
  },
};

export const AvecIconeSVG: Story = {
  args: {
    icon: <DoubleCheckIcon className="fill-primary-7" />,
  },
};

export const AvecSousTitre: Story = {
  args: {
    icon: 'lock-line',
    subtitle:
      'Cette section est visible uniquement par les membres de votre collectivité',
  },
};

export const CompletTitreLong: Story = {
  args: {
    icon: 'lock-line',
    iconPosition: 'right',
    title:
      'Titre long qui prend plusieurs lignes, qui est vraiment très long et qui ne finit pas de finir',
    subtitle:
      'Cette section est visible uniquement par les membres de votre collectivité',
  },
};
