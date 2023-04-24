import React from 'react';
import Tag from './Tag';

export default {
  component: Tag,
};

export const Default = () => (
  <div className="flex">
    <Tag title="Yolo" />
  </div>
);

export const AvecIcon = () => (
  <div className="flex">
    <Tag title="Yolo" onCloseClick={() => null} />
  </div>
);

export const CreeParUtilisateur = () => (
  <div className="flex">
    <Tag title="Yolo" isUserCreated />
  </div>
);
