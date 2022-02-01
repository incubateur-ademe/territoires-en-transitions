import {
  DoughnutWithNumber,
  DoughnutWithNumberProps,
} from './DoughnutWithNumber';
import {Story, Meta} from '@storybook/react';

const Template: Story<DoughnutWithNumberProps> = args => (
  <DoughnutWithNumber {...args} />
);
export const DoughnutWithNumberStory = Template.bind({});

const props: DoughnutWithNumberProps = {
  hexColor: '#000091',
  doughnutFillPercentage: 12,
  smallFontSizePx: 30,
  bigFontSizePx: 45,
  bigText: '15%',
  smallText: 'réalisé',
  tooltipText: '15 actions sur 100 réalisées',
};

DoughnutWithNumberStory.args = props;

export default {
  title: 'Charts/DoughnutWithNumberChart',
  component: DoughnutWithNumberStory,
} as Meta;
