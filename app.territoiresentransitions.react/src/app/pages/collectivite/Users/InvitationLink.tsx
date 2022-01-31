import {useEffect} from 'react';
import useCopyToClipboard from 'ui/shared/useCopyToClipboard';

// durée (en ms) pendant laquelle le message "copié !" est affiché sur la page
// après un clic sur le bouton "Copier"
const COPIED_HINT_DURATION = 3000;

type TInvitationLinkProps = {
  /** Lien d'invitation */
  link: string;
  /** Date d'expiration du lien d'invitation */
  linkExpiredAt: string;
  /** Appelée pour demander la généraiton d'un nouveau lien d'invitation */
  onGenerateLink: () => void;
};

/**
 * Affiche le lien d'invitation, un bouton "copier" (dans le presse-papier)
 * et un bouton pour générer un nouveau lien
 */
const InvitationLink = (props: TInvitationLinkProps) => {
  const {link, linkExpiredAt, onGenerateLink} = props;
  const [copiedText, copy, reset] = useCopyToClipboard();

  useEffect(() => {
    if (copiedText) {
      const id = setTimeout(() => {
        reset();
      }, COPIED_HINT_DURATION);

      return () => clearTimeout(id);
    }
    return;
  });

  return (
    <div className="flex flex-col max-w-2xl py-4">
      <div className="flex py-4">
        <input className="fr-input mr-4" readOnly value={link} />
        <button
          className="fr-btn fr-btn--secondary h-6"
          onClick={() => copy(link)}
        >
          Copier
        </button>
        {copiedText ? (
          <span className="mx-4 px-4 py-1 self-center rounded bg-green-500 text-white">
            copié&nbsp;!
          </span>
        ) : null}
      </div>
      <div className="flex max-w-2xl items-center justify-between">
        <span>
          Ce lien est valable jusqu'au
          <b>
            &nbsp;
            {new Date(linkExpiredAt).toLocaleDateString(undefined, {
              dateStyle: 'long',
            })}
            .
          </b>
        </span>
        <button
          className="fr-btn fr-btn--secondary h-6 ml-4"
          onClick={() => onGenerateLink()}
        >
          Générer un nouveau lien
        </button>
      </div>
    </div>
  );
};

export default InvitationLink;
