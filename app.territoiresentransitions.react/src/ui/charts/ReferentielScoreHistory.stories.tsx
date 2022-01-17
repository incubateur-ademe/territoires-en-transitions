import {
  ReferentielScoreHistory,
  ReferentielScoreHistoryProps,
} from './ReferentielScoreHistory';
import {Story, Meta} from '@storybook/react';

const Template: Story<ReferentielScoreHistoryProps> = args => (
  <ReferentielScoreHistory {...args} />
);
export const ReferentielScoreHistoryStory = Template.bind({});

const props: ReferentielScoreHistoryProps = {
  referentielMaxPoints: 500,
  data: [
    {date: 'nov-21', pointsFait: 10, pointsProgramme: 40},
    {date: 'déc-21', pointsFait: 15, pointsProgramme: 43},
    {date: 'jan-22', pointsFait: 23, pointsProgramme: 50},
    {date: 'fév-22', pointsFait: 36, pointsProgramme: 50},
  ],
};

ReferentielScoreHistoryStory.args = props;

export default {
  title: 'Charts/ReferentielScoreHistory',
  component: ReferentielScoreHistoryStory,
} as Meta;
