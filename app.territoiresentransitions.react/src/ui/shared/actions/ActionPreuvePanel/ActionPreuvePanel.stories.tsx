import {Story, Meta} from '@storybook/react';
// eslint-disable-next-line node/no-unpublished-import
import {action} from '@storybook/addon-actions';
import {ActionPreuvePanel, TActionPreuvePanelProps} from './ActionPreuvePanel';

const DEFAULT_ARGS = {
  onAdd: action('onAdd'),
};

export default {
  component: ActionPreuvePanel,
  args: DEFAULT_ARGS,
} as Meta;

const Template: Story<TActionPreuvePanelProps> = args => (
  <ActionPreuvePanel {...args} />
);

export const Default = Template.bind({});
Default.args = {
  ...DEFAULT_ARGS,
  preuve: {
    title:
      'Délibération indiquant l’engagement à développer un programme d’actions Économie circulaire',
  },
};

export const WithOptionalInfo = Template.bind({});
WithOptionalInfo.args = {
  ...DEFAULT_ARGS,
  preuve: {
    title: 'Fiches de poste des membres de l’équipe mises à jour ',
    info: 'Si l’élaboration d’une politique Économie circulaire a fait l’objet d’un travail spécifique, fournir le document le plus récent démontrant l’existence de celle-ci : Plan/Programme/Convention issue d’un Contrat de transition écologique, d’un CODEC, etc.',
  },
};

export const WithFiles = Template.bind({});
WithFiles.args = {
  ...DEFAULT_ARGS,
  preuve: {
    title:
      'Délibération qui donne délégation et/ou qui cite l’élu.e.s en charge de l’Économie Circulaire ',
    files: [
      {
        pathName: 'Délibération-Engagement-PCAET.pdf',
        comment: 'Cf pp 34-35 - Document provisoire, en attente d’approbation',
      },
    ],
  },
};
