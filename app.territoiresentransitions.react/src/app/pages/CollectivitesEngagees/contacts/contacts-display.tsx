import { RecherchesContact } from '@/api/collectiviteEngagees';
import { useState } from 'react';
import ContactButton from './contacts-button';
import ContactsModal from './contacts-modal';

const getFormattedPhone = (phoneNumber: string | undefined) => {
  if (!phoneNumber) return '';
  if (phoneNumber.length === 10) {
    return phoneNumber.replace(
      /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
      '$1 $2 $3 $4 $5'
    );
  }
  return phoneNumber;
};

type Props = {
  contacts: RecherchesContact[];
  collectiviteName: string;
  buttonClassName?: string;
};

const ContactsDisplay = ({
  contacts,
  collectiviteName,
  buttonClassName,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <ContactsModal
          contacts={contacts}
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
