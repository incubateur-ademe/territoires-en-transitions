import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from '../Input';
import {
  DEPRECATED_Table,
  DEPRECATED_TBody,
  DEPRECATED_TCell,
  DEPRECATED_THead,
  DEPRECATED_THeadCell,
  DEPRECATED_TRow,
} from './Table';

const meta: Meta<typeof DEPRECATED_Table> = {
  component: DEPRECATED_Table,
};

export default meta;

type Story = StoryObj<typeof DEPRECATED_Table>;

export const Exemple1: Story = {
  render: () => (
    <DEPRECATED_Table>
      <DEPRECATED_THead>
        <DEPRECATED_TRow>
          <DEPRECATED_THeadCell className="text-left uppercase">
            Colonne 1
          </DEPRECATED_THeadCell>
          <DEPRECATED_THeadCell className="uppercase w-1/5">
            Colonne 2
          </DEPRECATED_THeadCell>
          <DEPRECATED_THeadCell className="w-1/5">
            Colonne 3
          </DEPRECATED_THeadCell>
        </DEPRECATED_TRow>
      </DEPRECATED_THead>
      <DEPRECATED_TBody>
        <DEPRECATED_TRow>
          <DEPRECATED_TCell variant="title">cell 1.1</DEPRECATED_TCell>
          <DEPRECATED_TCell variant="number">cell 1.2</DEPRECATED_TCell>
          <DEPRECATED_TCell variant="input">
            <Input type="text" displaySize="sm" value="cell 1.3" />
          </DEPRECATED_TCell>
        </DEPRECATED_TRow>
        <DEPRECATED_TRow>
          <DEPRECATED_TCell variant="title">cell 2.1</DEPRECATED_TCell>
          <DEPRECATED_TCell variant="number">cell 2.2</DEPRECATED_TCell>
          <DEPRECATED_TCell variant="input">
            <Input type="text" displaySize="sm" value="cell 2.3" />
          </DEPRECATED_TCell>
        </DEPRECATED_TRow>
      </DEPRECATED_TBody>
    </DEPRECATED_Table>
  ),
};
