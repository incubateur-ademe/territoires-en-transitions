'use client';

import { appLabels } from '@/app/labels/catalog';
import {
  toAcceptAttribute,
  toFileConstraints,
} from '@/app/collectivites/documents/upload/constants';
import { validateFile } from '@/app/collectivites/documents/upload/validate-file';
import {
  DEMARCHE_DOCUMENTS_CONFIG_DEFAULT,
  PCAET_AVIS_PIECES_MAX,
  type PcaetAvisAuTitreDe,
} from '@tet/domain/demarches';
import type { DocumentHash } from '@tet/domain/collectivites';
import {
  Alert,
  Button,
  Event,
  Input,
  Modal,
  ModalFooterOKCancel,
  useEventTracker,
} from '@tet/ui';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useUploadAvisFile } from './data/use-upload-avis-file';
import { useUpsertAvis } from './data/use-upsert-avis';
import { useValiderAvis } from './data/use-valider-avis';

type Props = {
  /** La saisine sur laquelle l'avis se dépose : on ne finalise qu'un dossier transmis. */
  demandeAvisId: number;
  /**
   * Le titre au nom duquel l'avis est rendu. Il n'est pas demandé à
   * l'instructeur : chaque émetteur n'en porte qu'un — le préfet de région pour
   * la DREAL, le président de région pour le conseil régional.
   */
  auTitreDe: PcaetAvisAuTitreDe;
  onClose: () => void;
};

/** Pièces d'un avis : des PDF, comme le dossier réglementaire PCAET. */
const AVIS_FILE_CONSTRAINTS = toFileConstraints({
  ...DEMARCHE_DOCUMENTS_CONFIG_DEFAULT,
  formatsAutorises: ['pdf'],
  mimeTypesAutorises: ['application/pdf'],
});

export const FinaliserInstructionModal = ({
  demandeAvisId,
  auTitreDe,
  onClose,
}: Props) => {
  const [etape, setEtape] = useState<'rapport' | 'confirmation'>('rapport');
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [erreurFichier, setErreurFichier] = useState(false);
  const [erreurDepot, setErreurDepot] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progression, setProgression] = useState(0);
  const depotAbortRef = useRef<AbortController | null>(null);

  // Fermer la modale abandonne le dépôt : sans cela, un upload lent finirait
  // par valider l'avis dans le dos de l'instructeur qui y a renoncé.
  const abandonnerDepot = () => depotAbortRef.current?.abort();
  useEffect(() => abandonnerDepot, []);

  const tracker = useEventTracker();
  const trackModale = (etat: string, properties?: Record<string, unknown>) =>
    tracker(Event.demarches.pcaet.finaliserModale, {
      acteur: 'instructeur',
      etat,
      auTitreDe,
      demandeAvisId,
      ...properties,
    });
  const onOpened = useEffectEvent(() => trackModale('ouverte'));
  useEffect(() => onOpened(), []);

  const uploadAvisFile = useUploadAvisFile();
  const upsertAvis = useUpsertAvis();
  const validerAvis = useValiderAvis(demandeAvisId);

  const selectFiles = (files: FileList | null) => {
    const ajouts = Array.from(files ?? []);
    if (ajouts.length === 0) return;
    if (
      ajouts.some((file) => validateFile(file, AVIS_FILE_CONSTRAINTS)) ||
      fichiers.length + ajouts.length > PCAET_AVIS_PIECES_MAX
    ) {
      setErreurFichier(true);
      return;
    }
    setErreurFichier(false);
    setFichiers([...fichiers, ...ajouts]);
  };

  const deposerEtValider = async () => {
    if (fichiers.length === 0) return;
    const controller = new AbortController();
    depotAbortRef.current = controller;
    setIsSubmitting(true);
    setProgression(0);
    setErreurDepot(false);
    try {
      // Une pièce après l'autre : la progression affichée couvre l'ensemble.
      const hashes: DocumentHash[] = [];
      for (const [rang, fichier] of fichiers.entries()) {
        const hash = await uploadAvisFile(fichier, {
          signal: controller.signal,
          onProgress: (progress) =>
            setProgression(
              Math.round((rang * 100 + progress) / fichiers.length)
            ),
        });
        if (controller.signal.aborted) return;
        if (!hash) {
          setErreurDepot(true);
          return;
        }
        hashes.push(hash);
      }
      const avis = await upsertAvis.mutateAsync({
        demandeAvisId,
        auTitreDe,
        fichierRefs: hashes,
      });
      if (controller.signal.aborted) return;
      const avisDepose = avis.find((a) => a.auTitreDe === auTitreDe);
      if (!avisDepose) {
        setErreurDepot(true);
        return;
      }
      await validerAvis.mutateAsync({
        demandeAvisId,
        avisId: avisDepose.id,
      });
      trackModale('confirmee', { nbPieces: hashes.length });
      setEtape('confirmation');
    } catch {
      if (controller.signal.aborted) return;
      trackModale('erreur');
      setErreurDepot(true);
    } finally {
      if (depotAbortRef.current === controller) {
        depotAbortRef.current = null;
      }
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      size="md"
      openState={{
        isOpen: true,
        setIsOpen: (isOpen) => {
          if (isOpen) return;
          if (etape !== 'confirmation') trackModale('annulee');
          abandonnerDepot();
          onClose();
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
              <p className="m-0 text-sm text-grey-7">
                {appLabels.instructionFinaliserPiecesAide({
                  max: PCAET_AVIS_PIECES_MAX,
                })}
              </p>
              {fichiers.map((fichier, rang) => (
                <div
                  key={`${rang}-${fichier.name}`}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm text-grey-8">{fichier.name}</span>
                  {!isSubmitting && (
                    <Button
                      variant="grey"
                      size="xs"
                      icon="delete-bin-line"
                      aria-label={appLabels.instructionFinaliserRetirerFichier({
                        nom: fichier.name,
                      })}
                      onClick={() =>
                        setFichiers(fichiers.filter((_, i) => i !== rang))
                      }
                    />
                  )}
                </div>
              ))}
              {isSubmitting ? (
                <span className="text-sm text-grey-7" role="status">
                  {appLabels.progressionUpload({ progress: progression })}
                </span>
              ) : (
                fichiers.length < PCAET_AVIS_PIECES_MAX && (
                  <Input
                    type="file"
                    multiple
                    displaySize="md"
                    accept={toAcceptAttribute(AVIS_FILE_CONSTRAINTS)}
                    state={erreurFichier ? 'error' : undefined}
                    onDropFiles={selectFiles}
                    onChange={(e) => {
                      selectFiles(e.currentTarget.files);
                      // Sans cela, re-choisir un fichier retiré ne déclenche rien.
                      e.currentTarget.value = '';
                    }}
                  />
                )
              )}
              {erreurFichier && (
                <p className="text-sm text-error-1 m-0">
                  {appLabels.instructionFinaliserFichierRefuse({
                    max: PCAET_AVIS_PIECES_MAX,
                  })}
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
            btnCancelProps={{ onClick: close }}
            btnOKProps={{
              children: appLabels.instructionFinaliserValider,
              icon: 'arrow-right-line',
              iconPosition: 'right',
              disabled: fichiers.length === 0 || isSubmitting,
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
