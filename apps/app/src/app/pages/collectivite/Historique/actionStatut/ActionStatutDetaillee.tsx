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
        {appLabels.avancementFait}: {avancementDetaille[0] * 100} %
      </p>
      <p className="mb-0.5 text-sm whitespace-nowrap line-through">
        {appLabels.avancementProgramme}: {avancementDetaille[1] * 100} %
      </p>
      <p className="mb-0 text-sm whitespace-nowrap line-through">
        {appLabels.avancementPasFait}: {avancementDetaille[2] * 100} %
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
        {appLabels.avancementFait}: {avancementDetaille[0] * 100} %
      </p>
      <p className="mb-0.5 text-sm whitespace-nowrap">
        {appLabels.avancementProgramme}: {avancementDetaille[1] * 100} %
      </p>
      <p className="mb-0 text-sm whitespace-nowrap">
        {appLabels.avancementPasFait}: {avancementDetaille[2] * 100} %
      </p>
    </div>
  </>
);
