import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useState} from 'react';
import {AccordionControlled} from 'ui/Accordion';
import {ActionPreuvePanel} from 'ui/shared/actions/ActionPreuvePanel';
import {useActionPreuvesCount} from 'ui/shared/preuves/Bibliotheque/usePreuves';

type SubActionPreuvesAccordionProps = {
  subAction: ActionDefinitionSummary;
  openSubAction: boolean;
};

const SubActionPreuvesAccordion = (props: SubActionPreuvesAccordionProps) => {
  const {subAction} = props;
  const preuvesCount = useActionPreuvesCount(subAction);
  const [expanded, setExpanded] = useState(false);

  return (
    <AccordionControlled
      id={`Preuves-${subAction.id}`}
      dataTest={`PreuvesPanel-${subAction.identifiant}`}
      titre={`Documents (${preuvesCount})`}
      expanded={expanded}
      setExpanded={setExpanded}
      html={
        <ActionPreuvePanel
          action={subAction}
          showWarning
          disableFetch={!expanded}
        />
      }
    />
  );
};

export default SubActionPreuvesAccordion;
