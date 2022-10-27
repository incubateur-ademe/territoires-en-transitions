import {forwardRef, Ref} from 'react';

import DropdownFloater from 'ui/shared/floating-ui/DropdownFloater';
import {useDeleteCommentaireFromDiscussion} from './data/useDeleteCommentaireFromDiscussion';

type Props = {
  commentaire_id: number;
};

/** Menu et options pour un commentaire dans une discussion */
const ActionDiscussionCommentaireDropdown = ({commentaire_id}: Props) => {
  const {mutate: deleteCommentaire} = useDeleteCommentaireFromDiscussion();

  return (
    <>
      <DropdownFloater
        placement="bottom-end"
        render={({close}) => (
          <nav data-test="ActionDiscussionCommentaireMenu">
            <ul className="m-0 p-0">
              <li className="fr-nav__item pb-0 border-b border-gray-200">
                <button
                  className="fr-nav__link !flex !items-center !text-bf500 !py-2 !px-3 before:!hidden !shadow-none"
                  onClick={() => {
                    deleteCommentaire(commentaire_id);
                    close();
                  }}
                >
                  <span className="fr-fi-delete-line scale-75 mr-1" />
                  <span>Supprimer mon commentaire</span>
                </button>
              </li>
            </ul>
          </nav>
        )}
      >
        <ActionDiscussionCommentaireDropdownButtonDisplayed />
      </DropdownFloater>
    </>
  );
};

export default ActionDiscussionCommentaireDropdown;

const ActionDiscussionCommentaireDropdownButtonDisplayed = forwardRef(
  (
    {
      isOpen,
      ...props
    }: {
      isOpen?: boolean;
    },
    ref?: Ref<HTMLDivElement>
  ) => (
    <div ref={ref} className="shrink-0 flex border border-gray-200" {...props}>
      <button
        data-test="ActionDiscussionCommentaireMenuButton"
        className="p-0.5 text-bf500"
      >
        <span className="block fr-fi-menu-fill scale-75" />
      </button>
    </div>
  )
);
