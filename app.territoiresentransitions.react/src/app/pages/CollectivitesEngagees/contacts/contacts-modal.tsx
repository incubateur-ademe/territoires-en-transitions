import { RecherchesContact } from '@/api/collectiviteEngagees';
import { Icon, Modal, Tooltip, useCopyToClipboard } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import classNames from 'classnames';
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
  contacts: RecherchesContact[];
  collectiviteName: string;
  openState: OpenState;
};

const ContactsModal = ({ contacts, collectiviteName, openState }: Props) => {
  const [displayCopyMsg, setDisplayCopyMsg] = useState(false);
  const { copy } = useCopyToClipboard();

  const rowClassName = 'border-b border-b-[0.5px] border-primary-4';
  const headCellClassName = 'px-2 py-3 text-xs text-grey-9 uppercase';
  const bodyCellClassName = 'px-2 py-3 text-sm text-primary-10';

  return (
    <Modal
      openState={openState}
      size="xl"
      title="Liste des contacts"
      subTitle={collectiviteName}
      render={() => (
        <table>
          {/* En-tête du tableau */}
          <thead>
            <tr className={rowClassName}>
              <td className={classNames('min-w-28', headCellClassName)}>
                Contact
              </td>
              <td className={classNames('min-w-48', headCellClassName)}>
                Fonction
                <br />
                Intitulé du poste
              </td>
              <td className={classNames('min-w-28', headCellClassName)}>
                Tél. professionnel
              </td>
              <td className={classNames('min-w-48', headCellClassName)}>
                Email
              </td>
            </tr>
          </thead>

          {/* Contenu du tableau */}
          <tbody>
            {contacts.map((contact, idx) => (
              <tr
                key={idx}
                className={classNames(rowClassName, {
                  'bg-primary-0': idx % 2 !== 0,
                })}
              >
                <td className={bodyCellClassName}>
                  {contact.prenom} {contact.nom}
                </td>
                <td className={bodyCellClassName}>
                  {contact.fonction}
                  {contact.fonction ? <br /> : ''}
                  {contact.detailFonction}
                </td>
                <td className={classNames('font-bold', bodyCellClassName)}>
                  {getFormattedPhone(contact.telephone)}
                </td>
                <td className={classNames('font-bold', bodyCellClassName)}>
                  {contact.email}{' '}
                  <Tooltip
                    label={displayCopyMsg ? 'Copié !' : "Copier l'email"}
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
      )}
    />
  );
};

export default ContactsModal;
