import { Meta, StoryObj } from '@storybook/nextjs';
import { Input } from '../Input';
import { Table, TBody, TCell, THead, THeadCell, TRow } from './Table';

const meta: Meta<typeof Table> = {
  component: Table,
};

export default meta;

type Story = StoryObj<typeof Table>;

export const Exemple1: Story = {
  args: {
    children: [
      <THead>
        <TRow>
          <THeadCell className="text-left uppercase">Colonne 1</THeadCell>
          <THeadCell className="uppercase w-1/5">Colonne 2</THeadCell>
          <THeadCell className="w-1/5">Colonne 3</THeadCell>
        </TRow>
      </THead>,
      <TBody>
        <TRow>
          <TCell variant="title">cell 1.1</TCell>
          <TCell variant="number">cell 1.2</TCell>
          <TCell variant="input">
            <Input type="text" displaySize="sm" value="cell 1.3" />
          </TCell>
        </TRow>
        <TRow>
          <TCell variant="title">cell 2.1</TCell>
          <TCell variant="number">cell 2.2</TCell>
          <TCell variant="input">
            <Input type="text" displaySize="sm" value="cell 2.3" />
          </TCell>
        </TRow>
      </TBody>,
    ],
  },
};
