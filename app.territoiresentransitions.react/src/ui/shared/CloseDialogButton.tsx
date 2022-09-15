export const CloseDialogButton = ({
  setOpened,
}: {
  setOpened: (opened: boolean) => void;
}) => (
  <button
    className="fr-link fr-fi-close-line fr-link--icon-right self-end"
    onClick={e => {
      e.preventDefault();
      setOpened(false);
    }}
  >
    Fermer
  </button>
);
