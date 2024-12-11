'use client';

import { Panier } from '@/api';
import { ContenuListesFiltre } from '@tet/panier/components/FiltresActions/types';
import PanierRealtime from '@tet/panier/components/PanierRealtime';
import Section from '@tet/panier/components/Section';
import { ControlledAlert } from '@tet/ui';

type PagePanierProps = {
  panier: Panier;
} & ContenuListesFiltre;

const PagePanier = (props: PagePanierProps) => {
  return (
    <>
      <ControlledAlert
        title="Contenu en cours de validation par l’ADEME et en amélioration continue"
        fullPageWidth
      />

      <Section>
        <PanierRealtime {...props} />
      </Section>
    </>
  );
};

export default PagePanier;
