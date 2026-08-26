'use client';

import { makeCollectiviteDemarchePcaetRootUrl } from '@/app/app/paths';
import { useDemarchePcaetTransitionOptions } from '@/app/demarches/pcaet/data/use-transition-options';
import { useDeleteDemarchePcaet } from '@/app/demarches/pcaet/data/use-delete-demarche-pcaet';
import {
  DEMARCHE_PCAET_TRANSITION_ACTIONS,
  type DemarchePcaetMenuTransition,
} from '@/app/demarches/pcaet/constants';
import { appLabels } from '@/app/labels/catalog';
import { RouterOutput, useTRPC } from '@tet/api';
import {
  canDeleteDemarchePcaet,
  isDemarchePcaetEnCours,
} from '@tet/domain/demarches';
import { useMutation } from '@tanstack/react-query';
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
  const { mutate: deleteDemarche } = useDeleteDemarchePcaet();

  const trpc = useTRPC();
  const transitionOptions = useDemarchePcaetTransitionOptions();
  const reprendreElaboration = useMutation(
    trpc.demarches.pcaet.reprendreElaboration.mutationOptions(transitionOptions)
  );
  const publier = useMutation(
    trpc.demarches.pcaet.publier.mutationOptions(transitionOptions)
  );
  const depublier = useMutation(
    trpc.demarches.pcaet.depublier.mutationOptions(transitionOptions)
  );
  const archiver = useMutation(
    trpc.demarches.pcaet.archiver.mutationOptions(transitionOptions)
  );

  const detailUrl = makeCollectiviteDemarchePcaetRootUrl({
    collectiviteId: demarche.collectiviteId,
    demarcheId: demarche.id,
  });

  const ids = {
    collectiviteId: demarche.collectiviteId,
    demarcheId: demarche.id,
  };

  /** L'entrée n'apparaît que si le serveur a armé la transition. */
  const transitionAction = (
    transition: DemarchePcaetMenuTransition,
    run: () => void
  ): MenuAction[] =>
    demarche.transitions[transition].enabled
      ? [{ ...DEMARCHE_PCAET_TRANSITION_ACTIONS[transition], onClick: run }]
      : [];

  const menuActions: MenuAction[] = [
    {
      label: isDemarchePcaetEnCours(demarche.status)
        ? appLabels.demarcheActionContinuerSaisie
        : appLabels.demarcheActionConsulter,
      icon: 'edit-line',
      onClick: () => router.push(detailUrl),
    },
    // Les guards sont évalués côté serveur : le menu ne fait que suivre.
    ...transitionAction('reprendre_elaboration', () =>
      reprendreElaboration.mutate(ids)
    ),
    ...transitionAction('publier', () => publier.mutate(ids)),
    ...transitionAction('depublier', () => depublier.mutate(ids)),
    ...transitionAction('archiver', () => archiver.mutate(ids)),
    ...(canDeleteDemarchePcaet(demarche)
      ? [
          {
            label: appLabels.demarcheActionSupprimer,
            icon: 'delete-bin-line',
            onClick: () => setIsDeleteModalOpen(true),
          },
        ]
      : []),
  ];

  return (
    <>
      <ButtonMenu
        title={appLabels.demarcheListeActionsMenu}
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
              title={appLabels.demarcheSupprimerModaleTitre}
              description={appLabels.demarcheSupprimerModaleDescription({
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
