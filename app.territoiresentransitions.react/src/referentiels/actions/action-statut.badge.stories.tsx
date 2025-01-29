import ActionStatutBadge from './action-statut.badge';

export default {
  component: ActionStatutBadge,
};

export const Barre = () => <ActionStatutBadge statut="non_renseigne" barre />;
export const Small = () => (
  <ActionStatutBadge statut="non_renseigne" size="sm" />
);
export const NonRenseigne = () => <ActionStatutBadge statut="non_renseigne" />;
export const PasFait = () => <ActionStatutBadge statut="pas_fait" />;
export const Programme = () => <ActionStatutBadge statut="programme" />;
export const Detaille = () => <ActionStatutBadge statut="detaille" />;
export const Fait = () => <ActionStatutBadge statut="fait" />;
export const NonConcerne = () => <ActionStatutBadge statut="non_concerne" />;
