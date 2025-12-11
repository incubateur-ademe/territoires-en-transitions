import Markdown from '@/app/ui/Markdown';
import { Event, InfoActionImpact, Modal, useEventTracker } from '@tet/ui';
import { useState } from 'react';
import { useActionImpact } from './useActionImpact';

type ModaleActionImpactProps = {
  actionImpactId: number;
  children: React.JSX.Element;
};

/**
 * Affiche le descriptif d'une action à impact (du panier d'actions)
 */
export const ModaleActionImpact = (props: ModaleActionImpactProps) => {
  const { actionImpactId, children } = props;
  const { data: action } = useActionImpact(actionImpactId);
  const [isOpen, setIsOpen] = useState(false);
  const trackEvent = useEventTracker();

  if (!action) {
    return null;
  }

  const { titre, description, typologie } = action;
  return (
    <Modal
      size="lg"
      title={titre}
      subTitle={typologie?.nom}
      textAlign="left"
      openState={{
        isOpen,
        setIsOpen: (opened) => {
          if (opened) {
            trackEvent(Event.fiches.viewImpactInfo);
          }
          setIsOpen(opened);
        },
      }}
      render={() => {
        return (
          <InfoActionImpact
            action={action}
            descriptionMarkdown={
              <Markdown
                content={description}
                className="paragraphe-18 mb-8 [&_ul]:list-disc [&_ul]:pl-8"
              />
            }
          />
        );
      }}
    >
      {children}
    </Modal>
  );
};
