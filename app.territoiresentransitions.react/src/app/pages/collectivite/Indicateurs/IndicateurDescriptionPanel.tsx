import {CrossExpandPanelWithHtmlContent} from 'ui/shared';

export const IndicateurDescriptionPanel = (props: {description: string}) => {
  return (
    <div className="border-t border-gray-300">
      <CrossExpandPanelWithHtmlContent
        title="Description"
        content={props.description}
      />
    </div>
  );
};
