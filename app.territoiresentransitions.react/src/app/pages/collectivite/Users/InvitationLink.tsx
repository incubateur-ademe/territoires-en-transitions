import {useEffect} from 'react';
import useCopyToClipboard from 'ui/shared/useCopyToClipboard';
import {InvitationGenerateButton} from 'app/pages/collectivite/Users/InvitationGenerateButton';

// durée (en ms) pendant laquelle le message "copié !" est affiché sur la page
// après un clic sur le bouton "Copier"
const COPIED_HINT_DURATION = 3000;

type TInvitationLinkProps = {
  /** Lien d'invitation */
  link: string | null;
  /** Appelée pour demander la génération d'un nouveau lien d'invitation */
  onGenerateLink: () => void;
};

/**
 * Affiche le lien d'invitation, un bouton "copier" (dans le presse-papier)
 * et un bouton pour générer un nouveau lien
 */
const InvitationLink = (props: TInvitationLinkProps) => {
  const {link, onGenerateLink} = props;
  const displayedLink = link ?? '';
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
        <input className="fr-input mr-4" readOnly value={displayedLink} />
        <button
          className="fr-btn fr-btn--secondary h-6"
          onClick={() => copy(displayedLink)}
        >
          Copier
        </button>
        {copiedText ? (
          <span className="mx-4 px-4 py-1 self-center rounded bg-green-500 text-white">
            copié&nbsp;!
          </span>
        ) : null}
      </div>
      <div className="flex max-w-2xl items-center justify-end">
        <InvitationGenerateButton onClick={() => onGenerateLink()} />
      </div>
    </div>
  );
};

export default InvitationLink;
