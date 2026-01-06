import { makeCollectiviteActionUrl } from '@/app/app/paths';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { Button, VisibleWhen } from '@tet/ui';
import { useState } from 'react';
import { useFicheContext } from '../../context/fiche-context';
import { ContentLayout } from '../content-layout';
import { FicheActionCard } from './Carte/FicheActionCard';
import { FichePicto } from './FichePicto';
import { ModaleFichesLiees } from './ModaleFichesLiees';

export const ActionsLieesView = () => {
  const { fiche, isReadonly, isUpdating, fichesLiees } = useFicheContext();
  const collectivite = useCurrentCollectivite();
  const user = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <ContentLayout.Root>
        <ContentLayout.SharedAlert
          fiche={fiche}
          collectiviteId={collectivite.collectiviteId}
          title="Actions associées"
          description="Les actions affichées correspondent à celles de cette collectivité."
        />
        <ContentLayout.Empty
          isReadonly={isReadonly}
          picto={(props) => <FichePicto {...props} />}
          title="Cette action n'est liée à aucune autre action"
          subTitle="Lier une action"
          actions={[
            {
              children: 'Lier une action',
              icon: 'link',
              onClick: () => setIsModalOpen(true),
            },
          ]}
        />
        <ContentLayout.Content
          data={fichesLiees.list}
          isLoading={fichesLiees.isLoading}
          actions={
            <VisibleWhen condition={!isReadonly}>
              <Button
                icon={!isUpdating ? 'link' : undefined}
                size="xs"
                variant="outlined"
                disabled={isUpdating}
                onClick={() => setIsModalOpen(true)}
              >
                {isUpdating && <SpinnerLoader className="!h-4" />}
                Lier une action
              </Button>
            </VisibleWhen>
          }
        >
          {(ficheAction) => (
            <FicheActionCard
              key={ficheAction.id}
              ficheAction={ficheAction}
              link={makeCollectiviteActionUrl({
                collectiviteId: collectivite.collectiviteId,
                ficheUid: ficheAction.id.toString(),
              })}
              onUnlink={
                isReadonly
                  ? undefined
                  : () =>
                      fichesLiees.update(
                        fichesLiees.list
                          .filter((f) => f.id !== ficheAction.id)
                          .map((f) => f.id)
                      )
              }
              currentCollectivite={collectivite}
              currentUserId={user.id}
            />
          )}
        </ContentLayout.Content>
      </ContentLayout.Root>

      <ModaleFichesLiees
        isOpen={isModalOpen && !isReadonly}
        setIsOpen={setIsModalOpen}
        currentFicheId={fiche.id}
        linkedFicheIds={fichesLiees.list.map((f) => f.id)}
        updateLinkedFicheIds={(linkedficheIds) =>
          fichesLiees.update(linkedficheIds)
        }
      />
    </>
  );
};
