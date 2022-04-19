import {Story, Meta} from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import {Accordion, TAccordionProps} from './Accordion';

export default {
  component: Accordion,
} as Meta;

const Template: Story<TAccordionProps> = args => <Accordion {...args} />;

export const Exemple1 = Template.bind({});
Exemple1.args = {
  id: 'id1',
  titre: 'En savoir plus',
  html: 'contenu <b>HTML</b>',
};
