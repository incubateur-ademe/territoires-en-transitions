'use client';

import { appLabels } from '@/app/labels/catalog';
import { Badge } from '@tet/ui';
import { FicheSecteursAVerifier } from './data/use-list-plan-fiches-secteurs-a-verifier';
import { isFicheSecteursARenseigner } from './fiche-secteurs.utils';
import { usePlanSecteursVue } from './use-plan-secteurs-vue';

/**
 * Secteurs réglementaires d'une action, sur sa carte dans le plan. Une action
 * à renseigner ouvre le panneau de vérification sur elle.
 */
export const FicheSecteursBadge = ({
  fiche,
}: {
  fiche: FicheSecteursAVerifier;
}) => {
  const [, setVue] = usePlanSecteursVue();

  if (isFicheSecteursARenseigner(fiche)) {
    return (
      <button
        type="button"
        onClick={() => void setVue(String(fiche.ficheId))}
        className="rounded-md"
        data-test="plans.fiche-card.secteur-a-renseigner"
      >
        <Badge
          title={appLabels.planSecteurARenseignerPastille}
          variant="warning"
          size="sm"
          icon="error-warning-line"
          iconPosition="left"
        />
      </button>
    );
  }

  if (fiche.etat === 'attribue' && fiche.secteurs?.length) {
    return (
      <>
        {fiche.secteurs.map((secteur) => (
          <Badge
            key={secteur}
            title={appLabels.ficheSecteurReglementaireLabels[secteur]}
            variant="grey"
            size="sm"
          />
        ))}
      </>
    );
  }

  return null;
};
