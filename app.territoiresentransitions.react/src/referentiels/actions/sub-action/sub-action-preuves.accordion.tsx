import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ActionPreuvePanel } from '@/app/referentiels/actions/action-preuve.panel.lazy';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import { AccordionControlled } from '@/app/ui/Accordion';
import { useState } from 'react';

type SubActionPreuvesAccordionProps = {
  subAction: ActionDefinitionSummary;
  openSubAction: boolean;
};

const SubActionPreuvesAccordion = (props: SubActionPreuvesAccordionProps) => {
  const { subAction } = props;
  const preuvesCount = useActionPreuvesCount(subAction.id);
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
