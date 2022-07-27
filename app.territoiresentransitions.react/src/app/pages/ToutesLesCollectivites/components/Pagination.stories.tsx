import {Story, Meta} from '@storybook/react';
import {Pagination, TPaginationProps} from './Pagination';

export default {
  component: Pagination,
} as Meta;

const Template: Story<TPaginationProps> = args => (
  <ul>
    <Pagination {...args} />
  </ul>
);

export const UneSeulePage = Template.bind({});
const UneSeulePageArgs: TPaginationProps = {
  selectedPage: 1,
  nbOfPages: 1,
  onChange: (selected: number) => {
    console.log(selected);
  },
};
UneSeulePage.args = UneSeulePageArgs;

export const TroisPages = Template.bind({});
const TroisPagesArgs: TPaginationProps = {
  selectedPage: 1,
  nbOfPages: 3,
  onChange: (selected: number) => {
    console.log(selected);
  },
};
TroisPages.args = TroisPagesArgs;

export const SixPages = Template.bind({});
const SixPagesArgs: TPaginationProps = {
  selectedPage: 1,
  nbOfPages: 6,
  onChange: (selected: number) => {
    console.log(selected);
  },
};
SixPages.args = SixPagesArgs;

export const HuitPages = Template.bind({});
const HuitPagesArgs: TPaginationProps = {
  selectedPage: 1,
  nbOfPages: 8,
  onChange: (selected: number) => {
    console.log(selected);
  },
};
HuitPages.args = HuitPagesArgs;

export const CentPlusPage = Template.bind({});
const CentPlusPageArgs: TPaginationProps = {
  selectedPage: 110,
  nbOfPages: 140,
  onChange: (selected: number) => {
    console.log(selected);
  },
};
CentPlusPage.args = CentPlusPageArgs;
