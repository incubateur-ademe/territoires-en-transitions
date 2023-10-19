import {StoryFn, Meta} from '@storybook/react';
import {Pagination, TPaginationProps} from './Pagination';

export default {
  component: Pagination,
} as Meta;

const Template: StoryFn<TPaginationProps> = args => (
  <ul>
    <Pagination {...args} />
  </ul>
);

const UneSeulePageArgs: TPaginationProps = {
  selectedPage: 1,
  nbOfPages: 1,
  onChange: (selected: number) => {
    console.log(selected);
  },
};

export const UneSeulePage = {
  render: Template,
  args: UneSeulePageArgs,
};

const TroisPagesArgs: TPaginationProps = {
  selectedPage: 1,
  nbOfPages: 3,
  onChange: (selected: number) => {
    console.log(selected);
  },
};

export const TroisPages = {
  render: Template,
  args: TroisPagesArgs,
};

const SixPagesArgs: TPaginationProps = {
  selectedPage: 1,
  nbOfPages: 6,
  onChange: (selected: number) => {
    console.log(selected);
  },
};

export const SixPages = {
  render: Template,
  args: SixPagesArgs,
};

const HuitPagesArgs: TPaginationProps = {
  selectedPage: 1,
  nbOfPages: 8,
  onChange: (selected: number) => {
    console.log(selected);
  },
};

export const HuitPages = {
  render: Template,
  args: HuitPagesArgs,
};

const CentPlusPageArgs: TPaginationProps = {
  selectedPage: 110,
  nbOfPages: 140,
  onChange: (selected: number) => {
    console.log(selected);
  },
};

export const CentPlusPage = {
  render: Template,
  args: CentPlusPageArgs,
};
