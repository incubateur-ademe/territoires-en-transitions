import { ActionPreuvePanel } from '@/app/referentiels/actions/action-preuve.panel.lazy';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import { AccordionControlled } from '@tet/ui';
import { useState } from 'react';
import { ActionListItem } from '../use-list-actions';

type ActionDefinitionLike = Pick<
  ActionListItem,
  'actionId' | 'identifiant' | 'referentiel'
>;

type SubActionPreuvesAccordionProps = {
  subAction: ActionDefinitionLike;
};

const SubActionPreuvesAccordion = (props: SubActionPreuvesAccordionProps) => {
  const { subAction } = props;
  const preuvesCount = useActionPreuvesCount(subAction.actionId);
  const [expanded, setExpanded] = useState(false);

  return (
    <AccordionControlled
      id={`Preuves-${subAction.actionId}`}
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
