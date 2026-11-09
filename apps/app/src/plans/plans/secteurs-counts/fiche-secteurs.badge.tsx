'use client';

import { appLabels } from '@/app/labels/catalog';
import { Badge } from '@tet/ui';
import { FicheSecteursAVerifier } from './data/use-list-plan-fiches-secteurs-a-verifier';
import { isFicheSecteursARenseigner } from './fiche-secteurs.utils';
import { usePlanSecteursVue } from './use-plan-secteurs-vue';

/**
 * Pastille d'une action dont les secteurs réglementaires restent à renseigner,
 * posée à cheval sur le bas de sa carte. Un clic ouvre le panneau de
 * vérification sur elle.
 */
export const FicheSecteurARenseignerBadge = ({
  fiche,
}: {
  fiche: FicheSecteursAVerifier;
}) => {
  const [, setVue] = usePlanSecteursVue();

  if (!isFicheSecteursARenseigner(fiche)) {
    return null;
  }

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
};

/** Secteurs réglementaires validés d'une action, dans le pied de sa carte. */
export const FicheSecteursBadges = ({
  fiche,
}: {
  fiche: FicheSecteursAVerifier;
}) => {
  if (fiche.etat !== 'attribue' || !fiche.secteurs?.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {fiche.secteurs.map((secteur) => (
        <Badge
          key={secteur}
          title={appLabels.ficheSecteurReglementaireLabels[secteur]}
          variant="grey"
          size="sm"
        />
      ))}
    </div>
  );
};
