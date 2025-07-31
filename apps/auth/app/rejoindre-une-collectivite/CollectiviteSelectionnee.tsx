import { Alert, Button, Icon, useCopyToClipboard } from '@/ui';
import { CollectiviteInfo } from './useRejoindreUneCollectivite';

type Props = {
  collectivite: CollectiviteInfo | null;
};

export const CollectiviteSelectionnee = ({ collectivite }: Props) => {
  const { copy } = useCopyToClipboard();
  if (!collectivite) return;

  const { url, contacts } = collectivite;

  return (
    <div className="mt-6">
      <Alert
        state="info"
        title="Contactez l'une des personnes admin par mail pour recevoir un lien d’invitation"
        footer={
          <Button target="_blank" href={url}>
            Consulter le profil de cette collectivité en mode visiteur
          </Button>
        }
      />
      {!!contacts?.length && (
        <table className="w-full my-4">
          <thead>
            <tr className="uppercase text-grey-9 text-sm leading-[3rem] border-b border-primary-3">
              <td>Contact</td>
              <td>Email</td>
              <td>&nbsp;</td>
            </tr>
          </thead>
          <tbody>
            {contacts?.map((contact) => (
              <tr
                key={contact.email}
                className="even:bg-primary-1 text-md leading-[3rem] border-b border-primary-3"
              >
                <td>{`${contact?.prenom} ${contact?.nom}`}</td>
                <td>{contact.email}</td>
                <td>
                  <Icon
                    className="hover:text-primary cursor-pointer"
                    title="Copier dans le presse-papier"
                    icon="file-copy-line"
                    onClick={() => copy(contact.email)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
