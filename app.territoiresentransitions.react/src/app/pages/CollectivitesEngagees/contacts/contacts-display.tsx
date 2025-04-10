import { RecherchesContact } from '@/api/collectiviteEngagees';
import { useState } from 'react';
import ContactButton from './contacts-button';
import ContactsModal from './contacts-modal';

type Props = {
  contacts: RecherchesContact[];
  title?: string;
  collectiviteName: string;
  buttonClassName?: string;
};

const ContactsDisplay = ({
  contacts,
  title,
  collectiviteName,
  buttonClassName,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <ContactsModal
          contacts={contacts}
          title={title}
          collectiviteName={collectiviteName}
          openState={{ isOpen, setIsOpen }}
        />
      )}

      <ContactButton
        disabled={contacts.length === 0}
        className={buttonClassName}
        onClick={() => setIsOpen(true)}
      />
    </>
  );
};

export default ContactsDisplay;
