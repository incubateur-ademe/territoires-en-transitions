import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import { Badge } from '../Badge';
import { Accordion, AccordionControlled } from './Accordion';

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

export const ContenuPersonnalise: Story = {
  args: {
    content: <p className="font-bold border p-16">Contenu personnalisé</p>,
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

// export const AvecIconeSVG: Story = {
//   args: {
//     icon: <DoubleCheckIcon className="fill-primary-7" />,
//   },
// };

// export const AvecContenuAdditionnelHeader: Story = {
//   args: {
//     icon: <DoubleCheckIcon className="fill-primary-7" />,
//     headerContent: <Badge title="Badge" state="info" />,
//   },
// };

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
    title:
      'Titre long qui prend plusieurs lignes, qui est vraiment très long et qui ne finit pas de finir',
    subtitle:
      'Cette section est visible uniquement par les membres de votre collectivité',
    headerContent: <Badge title="Badge" state="info" />,
  },
};

export const CustomHeaderAndContent: Story = {
  args: {
    icon: 'lock-line',
    title:
      'Titre long qui prend plusieurs lignes, qui est vraiment très long et qui ne finit pas de finir',
    headerContent: <Badge title="Badge" state="info" className="!h-12" />,
    containerClassname: 'border border-primary-3 rounded-xl',
    headerClassname: 'px-6',
    content: (
      <div className="mx-6 border-t border-primary-3">
        <div className="p-12 font-bold">Contenu personnalisé</div>
      </div>
    ),
  },
};
