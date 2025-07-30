import { Meta} from '@storybook/nextjs';
import {action} from 'storybook/actions';
import {AddFromLib} from './AddFromLib';

export default {
  component: AddFromLib,
  args: {
    filters: {page: 1, search: ''},
    setFilters: action('setFilters'),
  },
} as Meta;

export const Vide = {
  args: {
    items: [],
    total: 0,
  },
};

const genMockFile = (count: number) =>
  Array(count)
    .fill(null)
    .map((_, i) => ({
      id: i + 1,
      filename: `exemple ${i + 1}`,
      filesize: 100,
      hash: 'fake',
    }));

export const Fichiers = {
  args: {
    items: genMockFile(4),
    total: 12,
  },
};
