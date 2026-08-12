'use client';

import { useQueryState } from 'nuqs';
import { ReactNode } from 'react';
import { SidePanelButton, SidePanelButtonProps } from './buttons';
import {
  ActionInfoSectionId,
  OPENED_SECTIONS_QUERY_PARAM,
  openedSectionsParser,
} from './informations.config';

export function InformationsSidePanelButton({
  openedSections,
  ...otherProps
}: Omit<SidePanelButtonProps, 'panelId' | 'beforeToggle'> & {
  openedSections?: ActionInfoSectionId[];
}): ReactNode {
  const [, setOpenedSections] = useQueryState(
    OPENED_SECTIONS_QUERY_PARAM,
    openedSectionsParser
  );

  return (
    <SidePanelButton
      panelId="informations"
      {...otherProps}
      beforeToggle={
        openedSections !== undefined
          ? () => setOpenedSections(openedSections)
          : undefined
      }
    />
  );
}
