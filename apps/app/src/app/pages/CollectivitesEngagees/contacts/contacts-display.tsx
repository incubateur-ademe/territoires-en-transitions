import { RecherchesViewParam } from '@/app/app/paths';
import { CollectiviteEngagee } from '@tet/api';
import { useState } from 'react';
import ContactButton from './contacts-button';
import ContactsModal from './contacts-modal';

type Props = {
  view: RecherchesViewParam;
  contacts: CollectiviteEngagee.RecherchesContact[];
  collectiviteName: string;
  buttonClassName?: string;
  onButtonClick?: () => void;
};

const ContactsDisplay = ({
  contacts,
  view,
  collectiviteName,
  buttonClassName,
  onButtonClick,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <ContactsModal
          contacts={contacts}
          view={view}
          collectiviteName={collectiviteName}
          openState={{ isOpen, setIsOpen }}
        />
      )}

      <ContactButton
        disabled={contacts.length === 0}
        className={buttonClassName}
        onClick={() => {
          setIsOpen(true);
          onButtonClick?.();
        }}
      />
    </>
  );
};

export default ContactsDisplay;
