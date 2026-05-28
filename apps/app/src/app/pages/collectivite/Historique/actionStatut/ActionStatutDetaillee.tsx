import { appLabels } from '@/app/labels/catalog';
import ActionStatutBadge from '@/app/referentiels/actions/action-statut/action-statut.badge';

export const PrecedenteActionStatutDetaille = ({
  avancementDetaille,
}: {
  avancementDetaille: number[];
}) => (
  <>
    <ActionStatutBadge statut="detaille" barre size="sm" />
    <div className="mt-2">
      <p className="mb-0.5 text-sm whitespace-nowrap line-through">
        {appLabels.detailleStatutPourcentage({
          statut: appLabels.avancementFait,
          percent: avancementDetaille[0] * 100,
        })}
      </p>
      <p className="mb-0.5 text-sm whitespace-nowrap line-through">
        {appLabels.detailleStatutPourcentage({
          statut: appLabels.avancementProgramme,
          percent: avancementDetaille[1] * 100,
        })}
      </p>
      <p className="mb-0 text-sm whitespace-nowrap line-through">
        {appLabels.detailleStatutPourcentage({
          statut: appLabels.avancementPasFait,
          percent: avancementDetaille[2] * 100,
        })}
      </p>
    </div>
  </>
);

export const NouvelleActionStatutDetaille = ({
  avancementDetaille,
}: {
  avancementDetaille: number[];
}) => (
  <>
    <ActionStatutBadge statut="detaille" size="sm" />
    <div className="mt-2">
      <p className="mb-0.5 text-sm whitespace-nowrap">
        {appLabels.detailleStatutPourcentage({
          statut: appLabels.avancementFait,
          percent: avancementDetaille[0] * 100,
        })}
      </p>
      <p className="mb-0.5 text-sm whitespace-nowrap">
        {appLabels.detailleStatutPourcentage({
          statut: appLabels.avancementProgramme,
          percent: avancementDetaille[1] * 100,
        })}
      </p>
      <p className="mb-0 text-sm whitespace-nowrap">
        {appLabels.detailleStatutPourcentage({
          statut: appLabels.avancementPasFait,
          percent: avancementDetaille[2] * 100,
        })}
      </p>
    </div>
  </>
);
