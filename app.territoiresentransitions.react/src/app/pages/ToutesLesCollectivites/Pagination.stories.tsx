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

export const PaginationAvecPlusDe3Pages = Template.bind({});
const paginationAvecPlusDe3PagesArgs: TPaginationProps = {
  selectedPage: 1,
  nbOfPages: 20,
  onChange: (selected: number) => {
    console.log(selected);
  },
};
PaginationAvecPlusDe3Pages.args = paginationAvecPlusDe3PagesArgs;

export const PaginationAvec1SeulePage = Template.bind({});
const paginationAvec1SeulePageArgs: TPaginationProps = {
  selectedPage: 1,
  nbOfPages: 1,
  onChange: (selected: number) => {
    console.log(selected);
  },
};
PaginationAvec1SeulePage.args = paginationAvec1SeulePageArgs;

export const PaginationAvec6Pages = Template.bind({});
const paginationAvec6PagesArgs: TPaginationProps = {
  selectedPage: 1,
  nbOfPages: 6,
  onChange: (selected: number) => {
    console.log(selected);
  },
};
PaginationAvec6Pages.args = paginationAvec6PagesArgs;

export const PaginationAvec8Pages = Template.bind({});
const paginationAvec8PagesArgs: TPaginationProps = {
  selectedPage: 1,
  nbOfPages: 8,
  onChange: (selected: number) => {
    console.log(selected);
  },
};
PaginationAvec8Pages.args = paginationAvec8PagesArgs;
