import { Meta} from '@storybook/react';
import {ToolbarIconButton} from './ToolbarIconButton';

export default {
  component: ToolbarIconButton,
} as Meta;

export const Default = {
  args: {
    icon: 'info',
  },
};

export const Pressed = {
  args: {
    icon: 'info',
    'aria-pressed': true,
  },
};
