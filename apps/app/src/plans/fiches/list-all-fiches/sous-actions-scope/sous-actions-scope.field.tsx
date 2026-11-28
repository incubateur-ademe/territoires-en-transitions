import { appLabels } from '@/app/labels/catalog';
import { Checkbox } from '@tet/ui';

type Props = {
  /** `true` : les filtres s'appliquent aussi aux sous-actions */
  withSousActionsMatches: boolean;
  onChange: (withSousActionsMatches: boolean) => void;
};

/**
 * Périmètre des filtres sur une ligne : « Appliquer les filtres sur : actions »
 * (à gauche de l'interrupteur), ou « Actions et sous-actions » (à droite).
 */
export const SousActionsScopeField = ({
  withSousActionsMatches,
  onChange,
}: Props) => (
  <div>
    <div className="flex flex-wrap items-center gap-2">
      {/* L'interrupteur porte déjà son libellé accessible : celui-ci n'est
          qu'un raccourci à la souris vers la position « actions uniquement ». */}
      <span
        aria-hidden
        className="text-primary-9 cursor-pointer whitespace-nowrap"
        onClick={() => onChange(false)}
      >
        {appLabels.filtresPerimetreActions}
      </span>
      <Checkbox
        variant="switch"
        labelClassname="whitespace-nowrap"
        label={appLabels.filtresPerimetreActionsEtSousActions}
        checked={withSousActionsMatches}
        onChange={(event) => onChange(event.target.checked)}
        data-test="plans.fiches.filtres.perimetre.actions-et-sous-actions"
      />
    </div>
    <p className="mt-2 mb-0 text-xs text-grey-7">
      {appLabels.filtresPerimetreInfo}
    </p>
  </div>
);
