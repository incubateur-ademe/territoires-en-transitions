import React from 'react';
import Alerte from './Alerte';

export default {
  component: Alerte,
};

export const Information = () => (
  <Alerte
    state="information"
    titre="Avec un titre"
    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque ultricies ante ligula, in ornare mauris faucibus sit amet. Pellentesque iaculis a metus a molestie."
  />
);

export const Succes = () => (
  <Alerte
    state="success"
    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque ultricies ante ligula, in ornare mauris faucibus sit amet. Pellentesque iaculis a metus a molestie."
  />
);

export const Warning = () => (
  <Alerte
    state="warning"
    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque ultricies ante ligula, in ornare mauris faucibus sit amet. Pellentesque iaculis a metus a molestie."
  />
);

export const Erreur = () => (
  <Alerte
    state="error"
    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque ultricies ante ligula, in ornare mauris faucibus sit amet. Pellentesque iaculis a metus a molestie."
  />
);

export const AvecContenuJSX = () => (
  <Alerte state="information">
    <ul>
      <li>
        contenu JSX passé en <code>children</code> au lieu du champ{' '}
        <code>description</code>
      </li>
    </ul>
  </Alerte>
);

export const AvecClassName = () => (
  <Alerte
    state="information"
    classname="fr-m-4w"
    description="des styles supplémentaires peuvent être passés dans le champ `classname`, par exemple ici des marges"
  />
);
