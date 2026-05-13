import Markdown from '@/app/ui/Markdown';
import { Event, InfoActionImpact, useEventTracker } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
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
      openState={{
        isOpen,
        setIsOpen: (opened) => {
          if (opened) {
            trackEvent(Event.fiches.viewImpactInfo);
          }
          setIsOpen(opened);
        },
      }}
    >
      <Modal.Trigger>{children}</Modal.Trigger>
      <Modal.Header>
        <Modal.Title>{titre}</Modal.Title>
        {typologie?.nom && <Modal.Subtitle>{typologie.nom}</Modal.Subtitle>}
      </Modal.Header>
      <Modal.Body>
        <InfoActionImpact
          action={action}
          descriptionMarkdown={
            <Markdown
              content={description}
              className="paragraphe-18 mb-8 [&_ul]:list-disc [&_ul]:pl-8"
            />
          }
        />
      </Modal.Body>
    </Modal>
  );
};
