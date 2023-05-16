import React from 'react';
import SideNav, {SideNavLinks} from './SideNav';

export default {
  component: SideNav,
};

const Navigation1NiveauLiens: SideNavLinks = [
  {
    link: 'link 1',
    displayName: 'Lien 1',
  },
  {
    link: 'link 2',
    displayName: 'Lien 1',
  },
];

export const Navigation1Niveau = () => (
  <SideNav links={Navigation1NiveauLiens} />
);

const NavigationAvecSectionsLiens: SideNavLinks = [
  {
    link: 'lien 1',
    displayName: 'Lien 1',
  },
  {
    link: 'lien 2',
    displayName: 'Section 1',
    enfants: [
      {
        link: 'lien 3',
        displayName: 'Enfant 1',
      },
      {
        link: 'lien 4',
        displayName: 'Enfant 2',
      },
    ],
  },
  {
    link: 'lien 5',
    displayName: 'Section 2',
    enfants: [
      {
        link: 'lien 6',
        displayName: 'Enfant 1',
      },
      {
        link: 'lien 7',
        displayName: 'Enfant 2',
      },
    ],
  },
  {
    link: 'lien 8',
    displayName: 'Lien 4',
  },
];

export const NavigationAvecSections = () => (
  <SideNav links={NavigationAvecSectionsLiens} />
);
