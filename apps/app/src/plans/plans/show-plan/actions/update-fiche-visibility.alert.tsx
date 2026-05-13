import { appLabels } from '@/app/labels/catalog';
import { AlertModal } from '@tet/ui/design-system/AlertModal/index';
import { OpenState } from '@tet/ui/utils/types';
import { JSX } from 'react';
import { useSetFichesPrivate } from './use-set-fiches-private';

type Props = {
  children?: JSX.Element;
  planId: number;
  isPrivate: boolean;
  openState?: OpenState;
};

/**
 * Modale pour modifier la confidentialité des actions d'un plan.
 */
const RestreindreFichesModal = ({
  children,
  planId,
  isPrivate,
  openState,
}: Props) => {
  const { mutate: setFichesPrivate } = useSetFichesPrivate();

  return (
    <AlertModal
      openState={openState}
    >
      {children && <AlertModal.Trigger>{children}</AlertModal.Trigger>}
      <AlertModal.Header>
        <AlertModal.Title>
          {isPrivate
            ? appLabels.rendreFichesPriveesQuestion
            : appLabels.rendreFichesPubliquesQuestion}
        </AlertModal.Title>
      </AlertModal.Header>
      <AlertModal.Body>
        <AlertModal.Description>
          {isPrivate
            ? appLabels.rendreFichesPriveesDescription
            : appLabels.rendreFichesPubliquesDescription}
        </AlertModal.Description>
      </AlertModal.Body>
      <AlertModal.Footer>
        <AlertModal.Cancel>{appLabels.annuler}</AlertModal.Cancel>
        <AlertModal.Action
          aria-label={appLabels.confirmer}
          onClick={() => setFichesPrivate({ planId, isPrivate })}
        >
          {appLabels.confirmer}
        </AlertModal.Action>
      </AlertModal.Footer>
    </AlertModal>
  );
};

export default RestreindreFichesModal;
