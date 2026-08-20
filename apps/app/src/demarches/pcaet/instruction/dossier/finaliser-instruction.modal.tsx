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
  PcaetAvisAuTitreDeEnum,
  pcaetAvisAuTitreDeValues,
  pcaetAvisSensValues,
  type PcaetAvisAuTitreDe,
  type PcaetAvisSens,
} from '@tet/domain/demarches';
import {
  Alert,
  Button,
  Field,
  Input,
  Modal,
  ModalFooterOKCancel,
  RadioButton,
  Textarea,
} from '@tet/ui';
import { useState } from 'react';
import { useEnvoyerAvis } from './data/use-envoyer-avis';
import { useUploadAvisFile } from './data/use-upload-avis-file';
import { useUpsertAvis } from './data/use-upsert-avis';
import { useValiderAvis } from './data/use-valider-avis';

type Dossier = RouterOutput['demarches']['pcaet']['getDossierInstruction'];

type Props = {
  dossier: Dossier;
  onClose: () => void;
};

/** Rapport d'avis : un seul PDF, comme le dossier réglementaire PCAET. */
const AVIS_FILE_CONSTRAINTS = toFileConstraints({
  ...DEMARCHE_DOCUMENTS_CONFIG_DEFAULT,
  formatsAutorises: ['pdf'],
  mimeTypesAutorises: ['application/pdf'],
});

export const FinaliserInstructionModal = ({ dossier, onClose }: Props) => {
  const [etape, setEtape] = useState<'rapport' | 'email'>('rapport');
  const [auTitreDe, setAuTitreDe] = useState<PcaetAvisAuTitreDe>(
    PcaetAvisAuTitreDeEnum.PREFET_REGION
  );
  const [sens, setSens] = useState<PcaetAvisSens | null>(null);
  const [fichier, setFichier] = useState<File | null>(null);
  const [erreurFichier, setErreurFichier] = useState(false);
  const [erreurDepot, setErreurDepot] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avisId, setAvisId] = useState<string | null>(null);
  const [objet, setObjet] = useState(
    appLabels.instructionPrevenirObjetModele({
      collectivite: dossier.collectivite.nom,
    })
  );
  const [message, setMessage] = useState(
    appLabels.instructionPrevenirContenuModele({
      collectivite: dossier.collectivite.nom,
    })
  );

  const uploadAvisFile = useUploadAvisFile();
  const upsertAvis = useUpsertAvis();
  const validerAvis = useValiderAvis(dossier.demandeAvisId);
  const envoyerAvis = useEnvoyerAvis(dossier.demandeAvisId);

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
    if (!fichier || !sens) return;
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
        sens,
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
      setAvisId(avisDepose.id);
      setEtape('email');
    } catch {
      setErreurDepot(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const envoyer = async () => {
    if (!avisId) return;
    const result = await envoyerAvis
      .mutateAsync({
        demandeAvisId: dossier.demandeAvisId,
        avisId,
        objet,
        message,
      })
      .catch(() => null);
    if (result) onClose();
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
          : appLabels.instructionPrevenirTitre
      }
      subTitle={
        etape === 'rapport'
          ? appLabels.instructionFinaliserEtape
          : appLabels.instructionPrevenirEtape
      }
      dataTest="demarches.pcaet.instruction.finaliser-modal"
      render={() =>
        etape === 'rapport' ? (
          <div className="flex flex-col gap-6">
            <fieldset className="flex flex-col gap-2">
              <legend className="font-medium text-primary-9 mb-2">
                {appLabels.instructionFinaliserAuTitreDe}
              </legend>
              <div className="flex flex-wrap gap-4">
                {pcaetAvisAuTitreDeValues.map((valeur) => (
                  <RadioButton
                    key={valeur}
                    name="au-titre-de"
                    value={valeur}
                    checked={auTitreDe === valeur}
                    onChange={() => setAuTitreDe(valeur)}
                    label={appLabels.demarchePcaetAvisAuTitreDeLabels[valeur]}
                  />
                ))}
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="font-medium text-primary-9 mb-2">
                {appLabels.instructionFinaliserSens}
              </legend>
              <div className="flex flex-wrap gap-4">
                {pcaetAvisSensValues.map((valeur) => (
                  <RadioButton
                    key={valeur}
                    name="sens"
                    value={valeur}
                    checked={sens === valeur}
                    onChange={() => setSens(valeur)}
                    label={appLabels.demarchePcaetAvisSensLabels[valeur]}
                  />
                ))}
              </div>
            </fieldset>
            <div className="flex flex-col gap-2">
              <p className="font-medium text-primary-9 m-0">
                {appLabels.instructionFinaliserAjouterRapport}
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
            {erreurDepot && (
              <Alert
                state="error"
                title={appLabels.instructionFinaliserErreur}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <p className="m-0">{appLabels.instructionPrevenirIntro}</p>
              <p className="m-0">{appLabels.instructionPrevenirIntroModele}</p>
            </div>
            <Field title={appLabels.instructionPrevenirObjetLabel}>
              <Input
                type="text"
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
              />
            </Field>
            <Field title={appLabels.instructionPrevenirContenuLabel}>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.currentTarget.value)}
                rows={7}
              />
            </Field>
          </div>
        )
      }
      renderFooter={({ close }) =>
        etape === 'rapport' ? (
          <ModalFooterOKCancel
            btnCancelProps={{ onClick: close, disabled: isSubmitting }}
            btnOKProps={{
              children: appLabels.validerEtPasserEtapeSuivante,
              icon: 'arrow-right-line',
              iconPosition: 'right',
              disabled: !fichier || !sens || isSubmitting,
              onClick: deposerEtValider,
            }}
          />
        ) : (
          <ModalFooterOKCancel
            btnCancelProps={{
              children: appLabels.instructionPrevenirPasser,
              onClick: close,
              disabled: envoyerAvis.isPending,
            }}
            btnOKProps={{
              disabled: envoyerAvis.isPending,
              onClick: envoyer,
            }}
          />
        )
      }
    />
  );
};
