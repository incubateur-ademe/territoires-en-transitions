import {
  membreFonctionToLabel,
  membreFonctionToTeteFonction,
} from '@/app/app/labels';
import { RecherchesViewParam } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { CollectiviteEngagee } from '@tet/api';
import { MembreFonction } from '@tet/domain/collectivites';
import { Icon, Tooltip, useCopyToClipboard } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { OpenState } from '@tet/ui/utils/types';
import { cn } from '@tet/ui/utils/cn';
import { useState } from 'react';

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
  contacts: CollectiviteEngagee.RecherchesContact[];
  view: RecherchesViewParam;
  collectiviteName: string;
  openState: OpenState;
};

const ContactsModal = ({
  contacts,
  view,
  collectiviteName,
  openState,
}: Props) => {
  const [displayCopyMsg, setDisplayCopyMsg] = useState(false);
  const { copy } = useCopyToClipboard();

  const rowClassName = 'border-b border-b-[0.5px] border-primary-4';
  const headCellClassName = 'px-2 py-3 text-xs text-grey-9 uppercase';
  const bodyCellClassName = 'px-2 py-3 text-sm text-primary-10';

  return (
    <Modal openState={openState} size="xl">
      <Modal.Header>
        <Modal.Title>
          {view === 'referentiels'
            ? appLabels.contactsListeReferents
            : appLabels.contactsListeContacts}
        </Modal.Title>
        <Modal.Subtitle>{collectiviteName}</Modal.Subtitle>
      </Modal.Header>
      <Modal.Body>
        <table>
          <thead>
            <tr className={rowClassName}>
              <td className={cn('min-w-28', headCellClassName)}>
                {appLabels.contactsColonneContact}
              </td>
              <td className={cn('min-w-48', headCellClassName)}>
                {appLabels.contactsColonneFonction}
                <br />
                {appLabels.contactsColonneIntituleDuPoste}
              </td>
              <td className={cn('min-w-28', headCellClassName)}>
                {appLabels.contactsColonneTelephone}
              </td>
              <td className={cn('min-w-48', headCellClassName)}>
                {appLabels.contactsColonneEmail}
              </td>
            </tr>
          </thead>

          <tbody>
            {contacts.map((contact, idx) => (
              <tr
                key={idx}
                className={cn(rowClassName, {
                  'bg-primary-0': idx % 2 !== 0,
                })}
              >
                <td className={bodyCellClassName}>
                  {contact.prenom} {contact.nom}
                </td>
                <td className={bodyCellClassName}>
                  {contact.fonction
                    ? view === 'referentiels'
                      ? membreFonctionToTeteFonction[contact.fonction]
                      : membreFonctionToLabel[
                          contact.fonction as MembreFonction
                        ]
                    : ''}
                  {contact.fonction ? <br /> : ''}
                  {contact.detailFonction}
                </td>
                <td className={cn('font-bold', bodyCellClassName)}>
                  {getFormattedPhone(contact.telephone)}
                </td>
                <td
                  className={cn(
                    'font-bold shrink-0 whitespace-nowrap',
                    bodyCellClassName
                  )}
                >
                  {contact.email}{' '}
                  <Tooltip
                    label={
                      displayCopyMsg
                        ? appLabels.contactsCopie
                        : appLabels.contactsCopier
                    }
                    openingDelay={0}
                  >
                    <Icon
                      icon="file-copy-line"
                      size="md"
                      className="cursor-pointer text-primary-7 hover:text-primary-9 transition-colors ml-1"
                      onClick={() => {
                        copy(contact.email);
                        setDisplayCopyMsg(true);
                      }}
                      onMouseLeave={() => setDisplayCopyMsg(false)}
                    />
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal.Body>
    </Modal>
  );
};

export default ContactsModal;
