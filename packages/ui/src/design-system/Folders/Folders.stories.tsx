import {Meta, StoryObj} from '@storybook/react';
import {Folders} from './Folders';

const meta: Meta<typeof Folders> = {
  component: Folders,
  args: {
    foldersList: [
      {
        id: '1',
        name: 'Folder 1',
        depth: 0,
        children: [
          {
            id: '11',
            name: 'Folder 1.1',
            depth: 1,
            children: [
              {
                id: '111',
                name: 'Folder 1.1.1',
                depth: 2,
                children: [
                  {id: '1111', name: 'Folder 1.1.1.1', depth: 3},
                  {id: '1112', name: 'Folder 1.1.1.2', depth: 3},
                ],
              },
              {
                id: '112',
                name: 'Folder 1.1.2',
                depth: 2,
              },
            ],
          },
          {
            id: '12',
            name: 'Folder 1.2',
            depth: 1,
            children: [
              {
                id: '121',
                name: 'Folder 1.2.1',
                depth: 2,
              },
            ],
          },
        ],
      },
      {
        id: '2',
        name: 'Folder 2',
        depth: 0,
        children: [
          {
            id: '21',
            name: 'Folder 2.1',
            depth: 1,
            children: [
              {
                id: '211',
                name: 'Folder 2.1.1',
                depth: 2,
                children: [{id: '2111', name: 'Folder 2.1.1.1', depth: 3}],
              },
              {
                id: '212',
                name: 'Folder 2.1.2',
                depth: 2,
              },
            ],
          },
        ],
      },
      {
        id: '3',
        name: 'Folder 3',
        depth: 0,
        children: [
          {
            id: '31',
            name: 'Folder 3.1',
            depth: 1,
            children: [
              {
                id: '311',
                name: 'Folder 3.1.1',
                depth: 2,
                children: [
                  {id: '3111', name: 'Folder 3.1.1.1', depth: 3},
                  {id: '3112', name: 'Folder 3.1.1.2', depth: 3},
                ],
              },
              {
                id: '312',
                name: 'Folder 3.1.2',
                depth: 2,
              },
            ],
          },
          {
            id: '32',
            name: 'Folder 3.2',
            depth: 1,
            children: [
              {
                id: '321',
                name: 'Folder 3.2.1',
                depth: 2,
              },
            ],
          },
        ],
      },
    ],
    onChangeSelection: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof Folders>;

export const Default: Story = {};
