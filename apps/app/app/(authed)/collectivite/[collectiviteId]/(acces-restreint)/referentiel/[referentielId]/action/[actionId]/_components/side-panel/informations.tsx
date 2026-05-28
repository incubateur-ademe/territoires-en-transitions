'use client';

import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import {
  getReferentielIdFromActionId,
  isNewReferentiel,
} from '@tet/domain/referentiels';
import { ReactNode } from 'react';
import ActionInformationsItem from '../information/action-information.item';

const INFORMATIONS_SECTIONS: Array<{
  property: keyof Pick<
    ActionListItem,
    | 'description'
    | 'contexte'
    | 'exemples'
    | 'ressources'
    | 'perimetreEvaluation'
  >;
  label: string;
  labelNewReferentiel?: string;
}> = [
  { property: 'description', label: 'Description' },
  { property: 'contexte', label: 'Contexte et réglementation' },
  {
    property: 'exemples',
    label: 'Exemples d’autres collectivités',
    labelNewReferentiel: 'Inspiration',
  },
  { property: 'ressources', label: 'Ressources' },
  { property: 'perimetreEvaluation', label: 'Précisions évaluation' },
];

export function InformationsPanelContent({
  action,
}: {
  action: ActionListItem;
}): ReactNode {
  const visibleSections = INFORMATIONS_SECTIONS.filter(
    ({ property }) => action[property].length > 0
  );
  const isNewRef = isNewReferentiel(
    getReferentielIdFromActionId(action.actionId)
  );

  return (
    <>
      {visibleSections.map((section, index) => (
        <ActionInformationsItem
          item={{
            property: section.property,
            label:
              isNewRef && section.labelNewReferentiel
                ? section.labelNewReferentiel
                : section.label,
            num: index + 1,
          }}
          isOpen={section.property === 'description'}
          action={action}
          key={section.property}
        />
      ))}
    </>
  );
}
