'use client';

import { makeCollectiviteDemarchePcaetRootUrl } from '@/app/app/paths';
import { useApplyDemarchePcaetTransition } from '@/app/demarches/pcaet/data/use-apply-demarche-pcaet-transition';
import { useDeleteDemarchePcaet } from '@/app/demarches/pcaet/data/use-delete-demarche-pcaet';
import { useSetDemarchePcaetPublication } from '@/app/demarches/pcaet/data/use-set-demarche-pcaet-publication';
import { DEMARCHE_PCAET_TRANSITION_LABELS } from '@/app/demarches/pcaet/demarche-pcaet.constants';
import { appLabels } from '@/app/labels/catalog';
import { RouterOutput } from '@tet/api';
import {
  canDeleteDemarchePcaet,
  canPublishDemarchePcaetStatus,
  DemarchePcaetPublicationStatusEnum,
  isActiveDemarchePcaetStatus,
} from '@tet/domain/demarches';
import {
  Alert,
  ButtonMenu,
  MenuAction,
  Modal,
  ModalFooterOKCancel,
} from '@tet/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Demarche = RouterOutput['demarches']['pcaet']['list'][number];

export const DemarchePcaetActionsMenu = ({
  demarche,
}: {
  demarche: Demarche;
}) => {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { mutate: applyTransition } = useApplyDemarchePcaetTransition();
  const { mutate: setPublicationStatus } = useSetDemarchePcaetPublication();
  const { mutate: deleteDemarche } = useDeleteDemarchePcaet();

  const detailUrl = makeCollectiviteDemarchePcaetRootUrl({
    collectiviteId: demarche.collectiviteId,
    demarchePcaetId: demarche.id,
  });

  const menuActions: MenuAction[] = [
    {
      label: isActiveDemarchePcaetStatus(demarche.status)
        ? appLabels.demarchePcaetActionContinuerSaisie
        : appLabels.demarchePcaetActionConsulter,
      icon: 'edit-line',
      onClick: () => router.push(detailUrl),
    },
    // Le menu est piloté par le workflow : les transitions applicables par
    // l'utilisateur (guards inclus) sont calculées côté serveur.
    ...demarche.availableTransitions
      .filter((transition) => DEMARCHE_PCAET_TRANSITION_LABELS[transition])
      .map((transition) => ({
        label: DEMARCHE_PCAET_TRANSITION_LABELS[transition] as string,
        icon: 'arrow-go-back-line',
        onClick: () =>
          applyTransition({
            collectiviteId: demarche.collectiviteId,
            demarcheId: demarche.id,
            transition,
          }),
      })),
    // La publication est une visibilité hors workflow, permise une fois adopté.
    ...(canPublishDemarchePcaetStatus(demarche.status)
      ? [
          demarche.publicationStatus ===
          DemarchePcaetPublicationStatusEnum.PUBLISHED
            ? {
                label: appLabels.demarchePcaetTransitionDepublier,
                icon: 'eye-off-line',
                onClick: () =>
                  setPublicationStatus({
                    collectiviteId: demarche.collectiviteId,
                    demarcheId: demarche.id,
                    publicationStatus: DemarchePcaetPublicationStatusEnum.DRAFT,
                  }),
              }
            : {
                label: appLabels.demarchePcaetTransitionPublier,
                icon: 'eye-line',
                onClick: () =>
                  setPublicationStatus({
                    collectiviteId: demarche.collectiviteId,
                    demarcheId: demarche.id,
                    publicationStatus:
                      DemarchePcaetPublicationStatusEnum.PUBLISHED,
                  }),
              },
        ]
      : []),
    ...(canDeleteDemarchePcaet(demarche)
      ? [
          {
            label: appLabels.demarchePcaetActionSupprimer,
            icon: 'delete-bin-line',
            onClick: () => setIsDeleteModalOpen(true),
          },
        ]
      : []),
  ];

  return (
    <>
      <ButtonMenu
        title={appLabels.demarchePcaetListeActionsMenu}
        icon="more-line"
        variant="grey"
        size="xs"
        menu={{ actions: menuActions }}
      />
      {isDeleteModalOpen && (
        <Modal
          size="sm"
          openState={{
            isOpen: isDeleteModalOpen,
            setIsOpen: setIsDeleteModalOpen,
          }}
          render={() => (
            <Alert
              title={appLabels.demarchePcaetSupprimerModaleTitre}
              description={appLabels.demarchePcaetSupprimerModaleDescription({
                titre: demarche.titre,
              })}
              state="warning"
              className="mt-4 py-2"
            />
          )}
          renderFooter={({ close }) => (
            <ModalFooterOKCancel
              btnCancelProps={{ onClick: close }}
              btnOKProps={{
                children: appLabels.confirmer,
                onClick: () => {
                  deleteDemarche({
                    collectiviteId: demarche.collectiviteId,
                    demarcheId: demarche.id,
                  });
                  close();
                },
                variant: 'primary',
              }}
            />
          )}
        />
      )}
    </>
  );
};
