'use client';

import { appLabels } from '@/app/labels/catalog';
import {
  toAcceptAttribute,
  toFileConstraints,
} from '@/app/referentiels/preuves/upload/constants';
import { validateFile } from '@/app/referentiels/preuves/upload/validate-file';
import type { RouterOutput } from '@tet/api';
import {
  DEMARCHE_DOCUMENTS_CONFIG_DEFAULT,
  type PcaetAvisAuTitreDe,
} from '@tet/domain/demarches';
import { Alert, Button, Input, Modal, ModalFooterOKCancel } from '@tet/ui';
import { useState } from 'react';
import { useUploadAvisFile } from './data/use-upload-avis-file';
import { useUpsertAvis } from './data/use-upsert-avis';
import { useValiderAvis } from './data/use-valider-avis';

type Dossier = RouterOutput['demarches']['pcaet']['getDossierInstruction'];

type Props = {
  dossier: Dossier;
  /**
   * Le titre au nom duquel l'avis est rendu. Il n'est pas demandé à
   * l'instructeur : chaque émetteur n'en porte qu'un — le préfet de région pour
   * la DREAL, le président de région pour le conseil régional.
   */
  auTitreDe: PcaetAvisAuTitreDe;
  onClose: () => void;
};

/** Rapport d'avis : un seul PDF, comme le dossier réglementaire PCAET. */
const AVIS_FILE_CONSTRAINTS = toFileConstraints({
  ...DEMARCHE_DOCUMENTS_CONFIG_DEFAULT,
  formatsAutorises: ['pdf'],
  mimeTypesAutorises: ['application/pdf'],
});

export const FinaliserInstructionModal = ({
  dossier,
  auTitreDe,
  onClose,
}: Props) => {
  const [etape, setEtape] = useState<'rapport' | 'confirmation'>('rapport');
  const [fichier, setFichier] = useState<File | null>(null);
  const [erreurFichier, setErreurFichier] = useState(false);
  const [erreurDepot, setErreurDepot] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadAvisFile = useUploadAvisFile();
  const upsertAvis = useUpsertAvis();
  const validerAvis = useValiderAvis(dossier.demandeAvisId);

  const selectFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (validateFile(file, AVIS_FILE_CONSTRAINTS)) {
      setErreurFichier(true);
      return;
    }
    setErreurFichier(false);
    setFichier(file);
  };

  const deposerEtValider = async () => {
    if (!fichier) return;
    setIsSubmitting(true);
    setErreurDepot(false);
    try {
      const hash = await uploadAvisFile(fichier);
      if (!hash) {
        setErreurDepot(true);
        return;
      }
      const avis = await upsertAvis.mutateAsync({
        demandeAvisId: dossier.demandeAvisId,
        auTitreDe,
        fichierRef: hash,
      });
      const avisDepose = avis.find((a) => a.auTitreDe === auTitreDe);
      if (!avisDepose) {
        setErreurDepot(true);
        return;
      }
      await validerAvis.mutateAsync({
        demandeAvisId: dossier.demandeAvisId,
        avisId: avisDepose.id,
      });
      setEtape('confirmation');
    } catch {
      setErreurDepot(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      size="md"
      openState={{
        isOpen: true,
        setIsOpen: (isOpen) => {
          if (!isOpen) onClose();
        },
      }}
      title={
        etape === 'rapport'
          ? appLabels.instructionFinaliserTitre
          : appLabels.instructionFinaliseeTitre
      }
      dataTest="demarches.pcaet.instruction.finaliser-modal"
      render={() =>
        etape === 'rapport' ? (
          <div className="flex flex-col gap-6">
            {/* L'avis, c'est le rapport : rien d'autre n'est demandé à
                l'instructeur que la pièce qui le porte. */}
            <div className="flex flex-col gap-2">
              <p className="font-medium text-primary-9 m-0">
                {appLabels.instructionFinaliserAjouterRapport}
              </p>
              <p className="m-0 text-sm text-grey-7">
                {appLabels.instructionFinaliserAvisConsultatif}
              </p>
              {fichier ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-grey-8">{fichier.name}</span>
                  <Button
                    variant="grey"
                    size="xs"
                    icon="delete-bin-line"
                    aria-label={appLabels.instructionFinaliserRetirerFichier}
                    onClick={() => setFichier(null)}
                  />
                </div>
              ) : (
                <Input
                  type="file"
                  displaySize="md"
                  accept={toAcceptAttribute(AVIS_FILE_CONSTRAINTS)}
                  state={erreurFichier ? 'error' : undefined}
                  onDropFiles={selectFiles}
                  onChange={(e) => selectFiles(e.currentTarget.files)}
                />
              )}
              {erreurFichier && (
                <p className="text-sm text-error-1 m-0">
                  {appLabels.instructionFinaliserFichierRefuse}
                </p>
              )}
            </div>
            {/* Dernier mot avant le pied de modale : la validation est
                irréversible, et c'est le bouton juste en dessous qui l'engage. */}
            <p className="m-0 text-sm text-primary-9">
              {appLabels.instructionFinaliserAvertissement}
            </p>
            {erreurDepot && (
              <Alert
                state="error"
                title={appLabels.instructionFinaliserErreur}
              />
            )}
          </div>
        ) : (
          // L'avis est déposé et validé : il n'y a plus rien à saisir, l'écran
          // ne fait qu'accuser réception.
          <div className="flex flex-col">
            <p className="m-0">{appLabels.instructionFinaliseeBravo}</p>
            <p className="m-0">{appLabels.instructionFinaliseeNotification}</p>
          </div>
        )
      }
      renderFooter={({ close }) =>
        etape === 'rapport' ? (
          <ModalFooterOKCancel
            btnCancelProps={{ onClick: close, disabled: isSubmitting }}
            btnOKProps={{
              children: appLabels.instructionFinaliserValider,
              icon: 'arrow-right-line',
              iconPosition: 'right',
              disabled: !fichier || isSubmitting,
              onClick: deposerEtValider,
            }}
          />
        ) : (
          // Un seul bouton : sans `btnCancelProps`, le pied de modale n'affiche
          // que celui-ci.
          <ModalFooterOKCancel
            btnOKProps={{
              children: appLabels.instructionFinaliseeFermer,
              onClick: close,
            }}
          />
        )
      }
    />
  );
};
