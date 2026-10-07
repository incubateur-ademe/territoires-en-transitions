'use client';

import { makeCollectiviteDemarchePcaetRootUrl } from '@/app/app/paths';
import { PublierDepotFinalModal } from '@/app/demarches/components/publier-depot-final.modal';
import { useDemarchePcaetTransitionOptions } from '@/app/demarches/pcaet/data/use-transition-options';
import { useDeleteDemarchePcaet } from '@/app/demarches/pcaet/data/use-delete-demarche-pcaet';
import {
  DEMARCHE_PCAET_OUVERTURE_ACTIONS,
  DEMARCHE_PCAET_TRANSITION_ACTIONS,
  type DemarchePcaetMenuTransition,
} from '@/app/demarches/pcaet/constants';
import { appLabels } from '@/app/labels/catalog';
import { RouterOutput, useTRPC } from '@tet/api';
import { canDeleteDemarchePcaet } from '@tet/domain/demarches';
import { useMutation } from '@tanstack/react-query';
import {
  Alert,
  Button,
  MenuAction,
  Modal,
  ModalFooterOKCancel,
  SplitButton,
} from '@tet/ui';
import { useState } from 'react';

type Demarche = RouterOutput['demarches']['pcaet']['list'][number];

/**
 * Les actions d'une ligne : ouvrir le dossier à un clic, le reste derrière la
 * flèche. Sans action secondaire, il ne reste qu'un bouton simple — une flèche
 * qui n'ouvre rien serait trompeuse.
 */
export const DemarchePcaetActionsButton = ({
  demarche,
}: {
  demarche: Demarche;
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // Publier depuis la liste engage autant que depuis le dossier : même
  // confirmation, et même saisie de la date d'adoption.
  const [isPublicationOuverte, setIsPublicationOuverte] = useState(false);
  const { mutate: deleteDemarche } = useDeleteDemarchePcaet();

  const trpc = useTRPC();
  const transitionOptions = useDemarchePcaetTransitionOptions();
  const publier = useMutation(
    trpc.demarches.pcaet.publier.mutationOptions(transitionOptions)
  );
  const archiver = useMutation(
    trpc.demarches.pcaet.archiver.mutationOptions(transitionOptions)
  );

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
    // Les guards sont évalués côté serveur : le menu ne fait que suivre.
    ...transitionAction('publier', () => setIsPublicationOuverte(true)),
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

  const ouverture = DEMARCHE_PCAET_OUVERTURE_ACTIONS[demarche.status];
  const ouvertureProps = {
    href: makeCollectiviteDemarchePcaetRootUrl(ids),
    variant: 'outlined',
    size: 'xs',
    icon: ouverture.icon,
    children: ouverture.label,
  } as const;

  return (
    <>
      {menuActions.length > 0 ? (
        <SplitButton {...ouvertureProps} menuActions={menuActions} />
      ) : (
        <Button {...ouvertureProps} />
      )}
      {isPublicationOuverte && (
        <PublierDepotFinalModal
          demarcheType={demarche.type}
          onConfirm={(dateAdoption) => publier.mutate({ ...ids, dateAdoption })}
          onClose={() => setIsPublicationOuverte(false)}
        />
      )}
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
