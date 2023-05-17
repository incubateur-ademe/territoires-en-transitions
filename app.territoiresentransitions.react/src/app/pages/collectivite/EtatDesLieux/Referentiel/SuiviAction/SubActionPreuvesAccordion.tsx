import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {Accordion} from 'ui/Accordion';
import {ActionPreuvePanel} from 'ui/shared/actions/ActionPreuvePanel';
import {useActionPreuvesCount} from 'ui/shared/preuves/Bibliotheque/usePreuves';

type SubActionPreuvesAccordionProps = {
  subAction: ActionDefinitionSummary;
  openSubAction: boolean;
};

const SubActionPreuvesAccordion = ({
  subAction,
  openSubAction,
}: SubActionPreuvesAccordionProps) => {
  const preuvesCount = useActionPreuvesCount(subAction);

  return (
    <Accordion
      id={`Preuves-${subAction.id}`}
      dataTest={`PreuvesPanel-${subAction.identifiant}`}
      titre={`Documents${
        preuvesCount !== undefined ? ` (${preuvesCount})` : ''
      }`}
      html={<ActionPreuvePanel action={subAction} showWarning />}
      initialState={openSubAction && (preuvesCount ?? 0) > 0}
    />
  );
};

export default SubActionPreuvesAccordion;
