'use client';

import type { DemarchePcaetVoletConfig } from '@/app/demarches/pcaet/demarche-pcaet.constants';
import type { PcaetDocumentsState } from '@/app/demarches/pcaet/pcaet-documents.constants';
import { Button, Modal } from '@tet/ui';
import Link from 'next/link';
import { PcaetDocumentsTable } from './pcaet-documents-table';
import { VoletIndicateurModalContent } from './volet-indicateur-modal-content';

type Props = {
  volet: DemarchePcaetVoletConfig | null;
  collectiviteId: number;
  isReadonly?: boolean;
  documents: PcaetDocumentsState;
  onDocumentsChange: (next: PcaetDocumentsState) => void;
  onClose: () => void;
};

export const VoletDiagnosticModal = ({
  volet,
  collectiviteId,
  isReadonly,
  documents,
  onDocumentsChange,
  onClose,
}: Props) => {
  const isOpen = volet !== null;

  return (
    <Modal
      size="xl"
      openState={{
        isOpen,
        setIsOpen: (open) => {
          if (!open) {
            onClose();
          }
        },
      }}
      title={volet?.label ?? ''}
      render={() => {
        if (!volet) {
          return null;
        }

        if (volet.modalKind === 'documents') {
          return (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-grey-7 m-0">
                Déposez les pièces liées à la vulnérabilité du territoire. La
                bibliothèque complète reste accessible depuis les paramètres de
                la collectivité.
              </p>
              {!isReadonly ? (
                <PcaetDocumentsTable
                  value={documents}
                  onChange={onDocumentsChange}
                  isReadonly={isReadonly}
                />
              ) : (
                <p className="text-sm text-grey-6">
                  La démarche est publiée : les documents ne sont plus modifiables
                  depuis cette vue.
                </p>
              )}
              <div className="flex justify-end">
                <Button variant="outlined" size="sm" href={volet.href(collectiviteId)}>
                  Ouvrir la bibliothèque
                </Button>
              </div>
            </div>
          );
        }

        if (!volet.indicateurIdentifiantReferentiel) {
          return (
            <p className="text-sm text-grey-7">
              Aucun indicateur n’est configuré pour ce volet.{' '}
              <Link
                href={volet.href(collectiviteId)}
                className="text-primary-8 underline"
              >
                Accéder à la page dédiée
              </Link>
            </p>
          );
        }

        return (
          <div className="max-h-[75vh] overflow-y-auto pr-1">
            <VoletIndicateurModalContent
              collectiviteId={collectiviteId}
              indicateurIdentifiantReferentiel={
                volet.indicateurIdentifiantReferentiel
              }
              voletLabel={volet.label}
              isReadonly={isReadonly}
            />
          </div>
        );
      }}
    />
  );
};
