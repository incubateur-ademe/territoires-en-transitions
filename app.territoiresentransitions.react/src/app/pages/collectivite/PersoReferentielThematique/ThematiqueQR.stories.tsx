import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {ThematiqueQR, TThematiqueQRProps} from './ThematiqueQR';
import {Q1, Q2, Q3} from '../PersoPotentielModal/fixture.json';

export default {
  component: ThematiqueQR,
} as Meta;

const Template: Story<TThematiqueQRProps> = args => <ThematiqueQR {...args} />;

export const PlusieursQuestions = Template.bind({});
PlusieursQuestions.args = {
  collectivite: {
    id: 1,
    nom: 'Grand Montauban',
  },
  thematique: {
    nom: 'Urbanisme et habitat',
  },
  questionReponses: [Q1, Q2, {...Q3, reponse: 60}],
  onChange: action('onChange'),
};
