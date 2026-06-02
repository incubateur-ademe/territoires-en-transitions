'use client';

import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { toggleArrayValue } from '@/app/utils/toggle-array-value';
import {
  getReferentielIdFromActionId,
  isNewReferentiel,
} from '@tet/domain/referentiels';
import { useQueryState } from 'nuqs';
import { ReactNode } from 'react';
import {
  getVisibleInformationsSections,
  OPENED_SECTIONS_QUERY_PARAM,
  openedSectionsParser,
} from './informations.config';
import { ActionInformationsItem } from './informations.item';

export function InformationsPanelContent({
  action,
}: {
  action: ActionListItem;
}): ReactNode {
  const visibleSections = getVisibleInformationsSections(action);
  const isNewRef = isNewReferentiel(
    getReferentielIdFromActionId(action.actionId)
  );
  const [openedSections, setOpenedSectionsQueryParam] = useQueryState(
    OPENED_SECTIONS_QUERY_PARAM,
    openedSectionsParser
  );
  const openedSectionsResolved = openedSections ?? ['description'];

  return (
    <>
      {visibleSections.map((section, index) => (
        <ActionInformationsItem
          item={{
            sectionId: section.sectionId,
            label:
              isNewRef && section.labelNewReferentiel
                ? section.labelNewReferentiel
                : section.label,
            num: index + 1,
          }}
          openState={{
            isOpen: openedSectionsResolved.includes(section.sectionId),
            setIsOpen: (open) =>
              setOpenedSectionsQueryParam((prev) =>
                toggleArrayValue(
                  prev ?? ['description'],
                  section.sectionId,
                  open
                )
              ),
          }}
          action={action}
          key={section.sectionId}
        />
      ))}
    </>
  );
}
