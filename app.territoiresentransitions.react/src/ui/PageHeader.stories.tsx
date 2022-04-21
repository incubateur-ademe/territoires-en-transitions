import {Meta} from '@storybook/react';
import {PageHeader, PageHeaderLeft} from './PageHeader';

export default {
  component: PageHeader,
} as Meta;

export const TitreCentral = () => (
  <PageHeader>
    <h2 className="w-full text-center m-0">Titre au centre</h2>
  </PageHeader>
);

export const TitreEtBouton = () => (
  <PageHeaderLeft>
    <h2 className="fr-mb-2w">Titre</h2>
    <button className="fr-btn self-start">Bouton</button>
  </PageHeaderLeft>
);

export const SurtitreTitreEtBouton = () => (
  <PageHeaderLeft>
    <p className="m-0">Sur titre</p>
    <h2 className="fr-mb-2w">Titre</h2>
    <button className="fr-btn self-start">Bouton</button>
  </PageHeaderLeft>
);
