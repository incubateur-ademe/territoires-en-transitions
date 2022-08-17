import React from 'react';
import ActionStatusBadge from './ActionStatusBadge';

export default {
  component: ActionStatusBadge,
};

export const Barre = () => <ActionStatusBadge status="non_renseigne" barre />;
export const NonRenseigne = () => <ActionStatusBadge status="non_renseigne" />;
export const PasFait = () => <ActionStatusBadge status="pas_fait" />;
export const Programme = () => <ActionStatusBadge status="programme" />;
export const Detaille = () => <ActionStatusBadge status="detaille" />;
export const Fait = () => <ActionStatusBadge status="fait" />;
