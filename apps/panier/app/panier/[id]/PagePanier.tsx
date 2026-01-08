'use client';

import { ContenuListesFiltre } from '@/panier/components/FiltresActions/types';
import PanierRealtime from '@/panier/components/PanierRealtime';
import Section from '@/panier/components/Section';
import { Panier } from '@tet/api';
import { Alert } from '@tet/ui';

type PagePanierProps = {
  panier: Panier;
} & ContenuListesFiltre;

const PagePanier = (props: PagePanierProps) => {
  return (
    <>
      <Alert title="Contenu en cours de validation par l'ADEME et en amélioration continue" />

      <Section>
        <PanierRealtime {...props} />
      </Section>
    </>
  );
};

export default PagePanier;
