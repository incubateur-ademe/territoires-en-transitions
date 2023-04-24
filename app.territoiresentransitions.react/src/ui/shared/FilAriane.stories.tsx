import React from 'react';
import FilAriane from './FilAriane';

export default {
  component: FilAriane,
};

const links = [
  {path: '#', displayedName: "Plan d'action"},
  {path: '#', displayedName: 'Axe 1'},
  {displayedName: 'La page actuelle'},
];

export const Default = () => <FilAriane links={links} />;
