export const CloseDialogButton = ({
  setOpened,
}: {
  setOpened: (opened: boolean) => void;
}) => (
  <a
    className="fr-link fr-fi-close-line fr-link--icon-right self-end"
    href="#"
    onClick={e => {
      e.preventDefault();
      setOpened(false);
    }}
  >
    Fermer
  </a>
);
