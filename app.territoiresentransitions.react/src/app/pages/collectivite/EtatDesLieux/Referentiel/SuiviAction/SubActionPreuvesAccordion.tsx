import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {Accordion} from 'ui/Accordion';
import {ActionPreuvePanel} from 'ui/shared/actions/ActionPreuvePanel';
import {useActionPreuvesCount} from 'ui/shared/preuves/Bibliotheque/usePreuves';

type SubActionPreuvesAccordionProps = {
  subAction: ActionDefinitionSummary;
  openSubAction: boolean;
};

const SubActionPreuvesAccordion = (props: SubActionPreuvesAccordionProps) => {
  const {subAction, openSubAction} = props;
  const preuvesCount = useActionPreuvesCount(subAction);
  const accordionContent =
    openSubAction && preuvesCount > 0 ? (
      <ActionPreuvePanel action={subAction} showWarning />
    ) : null;

  return (
    <Accordion
      id={`Preuves-${subAction.id}`}
      dataTest={`PreuvesPanel-${subAction.identifiant}`}
      titre={`Documents (${preuvesCount})`}
      html={accordionContent}
      initialState={!!accordionContent}
    />
  );
};

export default SubActionPreuvesAccordion;
