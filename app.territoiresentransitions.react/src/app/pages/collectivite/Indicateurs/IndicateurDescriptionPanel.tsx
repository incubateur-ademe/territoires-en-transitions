import {CrossExpandPanelWithHtmlContent} from 'ui/shared';
import React from 'react';

export const IndicateurDescriptionPanel = (props: {description: string}) => {
  return (
    <div className={'border-t border-b border-gray-300'}>
      <CrossExpandPanelWithHtmlContent
        title="Description"
        content={props.description}
      />
    </div>
  );
};
