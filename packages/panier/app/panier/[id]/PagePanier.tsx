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
};

const PagePanier = ({panier, budgets, temps, thematiques}: PagePanierProps) => {
  return (
    <>
      <ControlledAlert
        title="Contenu en cours de validation par l’ADEME et en amélioration continue"
        fullPageWidth
      />

      <Section>
        <PanierRealtime {...{panier, budgets, temps, thematiques}} />
      </Section>
    </>
  );
};

export default PagePanier;
