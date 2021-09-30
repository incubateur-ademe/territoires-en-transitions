import {CrossExpandPanelWithHtmlContent} from 'ui/shared';

export const IndicateurDescriptionPanel = (props: {description: string}) => {
  if (props.description === '') return null;
  return (
    <div className="border-t border-gray-300">
      <CrossExpandPanelWithHtmlContent
        title="Description"
        content={props.description}
      />
    </div>
  );
};
