import React from 'react';
import {Meta} from '@storybook/react';
import {Notice, NoticeAlert} from './Notice';

export default {
  component: Notice,
} as Meta;

export const Exemple = () => <Notice message="Titre du bandeau" />;

export const ExempleAlert = () => <NoticeAlert message="Titre du bandeau" />;
