import {Meta} from '@storybook/react';
import {Badge} from './index';

export default {
  component: Badge,
} as Meta;

export const Success = () => <Badge status="success">Succès</Badge>;
export const Info = () => <Badge status="info">Info</Badge>;
