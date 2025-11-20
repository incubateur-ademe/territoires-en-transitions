import { ActionPreuvePanel } from '@/app/referentiels/actions/action-preuve.panel.lazy';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { AccordionControlled } from '@tet/ui';
import { useState } from 'react';

type SubActionPreuvesAccordionProps = {
  subAction: ActionDefinitionSummary;
};

const SubActionPreuvesAccordion = (props: SubActionPreuvesAccordionProps) => {
  const { subAction } = props;
  const preuvesCount = useActionPreuvesCount(subAction.id);
  const [expanded, setExpanded] = useState(false);

  return (
    <AccordionControlled
      id={`Preuves-${subAction.id}`}
      dataTest={`PreuvesPanel-${subAction.identifiant}`}
      title={`Documents (${preuvesCount})`}
      expanded={expanded}
      setExpanded={setExpanded}
      content={
        <ActionPreuvePanel
          action={subAction}
          showWarning
          disableFetch={!expanded}
          className="mb-4 mx-2"
        />
      }
    />
  );
};

export default SubActionPreuvesAccordion;
