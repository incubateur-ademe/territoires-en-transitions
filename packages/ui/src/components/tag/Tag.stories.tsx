import React from 'react';
import { action } from '@storybook/addon-actions';
import { Tag } from './Tag';

export default {
  component: Tag,
};

export const Default = () => (
  <div className="flex">
    <Tag title="Yolo" />
  </div>
);

export const AvecBoutonFermer = () => (
  <div className="flex">
    <Tag title="Yolo" onClose={action('onClose')} />
  </div>
);

export const CreeParUtilisateur = () => (
  <div className="flex">
    <Tag title="Yolo" isUserCreated onClose={action('onClose')} />
  </div>
);

export const StylePersonnalise = () => (
  <div className="flex">
    <Tag title="Yolo" className="!bg-error-1 font-bold" />
  </div>
);
