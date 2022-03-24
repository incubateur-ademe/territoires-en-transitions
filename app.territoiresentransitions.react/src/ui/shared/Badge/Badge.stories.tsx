import {Meta} from '@storybook/react';
import {Badge} from './index';

export default {
  component: Badge,
} as Meta;

export const success = () => <Badge status="success">Succès</Badge>;
export const info = () => <Badge status="info">Info</Badge>;
