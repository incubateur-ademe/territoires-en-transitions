'use client';

import PanierRealtime from '@tet/panier/components/PanierRealtime';
import Section from '@tet/panier/components/Section';
import {
  ActionImpactFourchetteBudgetaire,
  ActionImpactTempsMiseEnOeuvre,
  ActionImpactThematique,
  Panier,
} from '@tet/api';
import {ControlledAlert} from '@tet/ui';

type PagePanierProps = {
  panier: Panier;
  budgets: ActionImpactFourchetteBudgetaire[];
  temps: ActionImpactTempsMiseEnOeuvre[];
  thematiques: ActionImpactThematique[];
  sansFiltreCompetences: boolean;
};

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
