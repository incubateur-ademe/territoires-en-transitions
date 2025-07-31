'use client';

import { Panier } from '@/api';
import { ContenuListesFiltre } from '@/panier/components/FiltresActions/types';
import PanierRealtime from '@/panier/components/PanierRealtime';
import Section from '@/panier/components/Section';
import { ControlledAlert } from '@/ui';

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
