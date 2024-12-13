import { ActionDefinitionSummary } from '@/app/core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import { AccordionControlled } from '@/app/ui/Accordion';
import { ActionPreuvePanel } from '@/app/ui/shared/actions/ActionPreuvePanel';
import { useActionPreuvesCount } from '@/app/ui/shared/preuves/Bibliotheque/usePreuves';
import { useState } from 'react';

type SubActionPreuvesAccordionProps = {
  subAction: ActionDefinitionSummary;
  openSubAction: boolean;
};

const SubActionPreuvesAccordion = (props: SubActionPreuvesAccordionProps) => {
  const { subAction } = props;
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
