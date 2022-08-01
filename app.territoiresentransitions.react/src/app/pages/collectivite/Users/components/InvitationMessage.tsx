import {useEffect, useMemo} from 'react';
import useCopyToClipboard from 'ui/shared/useCopyToClipboard';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {UserData} from 'core-logic/api/auth/AuthProvider';
import {NiveauAcces} from 'generated/dataLayer';

// durée (en ms) pendant laquelle le message "copié !" est affiché sur la page
// après un clic sur le bouton "Copier"
const COPIED_HINT_DURATION = 1500;

type TInvitationMessageProps = {
  /** La collectivité à associé à l'utilisateur */
  currentCollectivite: CurrentCollectivite;
  /** L'utilisateur qui envoie l'invitation */
  currentUser: UserData;
  /** Niveau d'acces pour l'invitation */
  acces: NiveauAcces;
  /** URL de l'invitation */
  invitationUrl: string;
};

/**
 * Affiche le message d'invitation, un bouton "copier le message" (dans le presse-papier)
 * et un bouton pour uniquement copier le lien
 */
const InvitationMessage = ({
  currentUser,
  currentCollectivite,
  acces,
  invitationUrl,
}: TInvitationMessageProps) => {
  const [copiedText, copy, reset] = useCopyToClipboard();

  useEffect(() => {
    if (copiedText) {
      const id = setTimeout(() => {
        reset();
      }, COPIED_HINT_DURATION);

      return () => clearTimeout(id);
    }
    return;
  }, [copiedText]);

  const message = useMemo(
    () =>
      `Objet : Invitation à collaborer sur Territoires en transitions.fr\n\nBonjour,\n\n${currentUser.prenom} ${currentUser.nom} de ${currentCollectivite.nom} vous invite à collaborer.\n\nLe lien suivant vous donnera un accès ${acces} pour cette collectivité.\n\nCliquez sur le lien suivant pour accepter l’invitation et créer votre compte :\nlien ${invitationUrl}\n\n---------\n\nTerritoires en transitions est une initiative de l’ADEME pour accompagner la transition écologique des collectivités.`,
    [currentCollectivite, currentUser, acces, invitationUrl]
  );

  const htmlMessage = useMemo(() => {
    return {__html: message.replace(/(?:\r\n|\r|\n)/g, '<br>')};
  }, [message]);

  return (
    <div className="mt-8 p-4 border border-grey-200 md:mt-0 md:p-8">
      {/* Introduction */}
      <p>
        <span className="font-bold">
          Cette personne n’a pas encore de compte.
        </span>{' '}
        Voici une proposition de message que vous pouvez lui envoyer par email
        pour l’inviter à rejoindre votre collectivité :
      </p>
      {/* Message */}
      <div className="p-4 bg-gray-200 rounded-t">
        <p
          data-test="invitation-message"
          className="text-gray-600 text-sm mb-0"
          dangerouslySetInnerHTML={htmlMessage}
        />
      </div>
      {/* Buttons */}
      <div className="relative mt-4 flex flex-col gap-4 md:flex-row">
        <button
          data-test="copier-message"
          className="fr-btn justify-center"
          onClick={() => copy(message)}
        >
          Copier le message
        </button>
        <button
          data-test="copier-url"
          className="fr-btn fr-btn--secondary"
          onClick={() => copy(invitationUrl ? invitationUrl : '')}
        >
          Copier uniquement le lien d’invitation
        </button>
        {copiedText && (
          <span className="absolute left-0 bottom-full mb-2 px-4 py-1 rounded bg-green-500 text-white">
            copié&nbsp;!
          </span>
        )}
      </div>
    </div>
  );
};

export default InvitationMessage;
