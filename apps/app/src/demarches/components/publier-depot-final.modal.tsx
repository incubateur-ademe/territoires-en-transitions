'use client';

import { appLabels } from '@/app/labels/catalog';
import type { DemarcheType } from '@tet/domain/demarches';
import { DEMARCHE_PCAET_VALIDITE_ANS } from '@tet/domain/demarches';
import { Field, Input, Modal, ModalFooterOKCancel } from '@tet/ui';
import { useState } from 'react';

type Props = {
  demarcheType: DemarcheType;
  onConfirm: (dateAdoption: string) => void;
  onClose: () => void;
};

const DATE_ADOPTION_FIELD_ID = 'demarche-publier-date-adoption';

/** Jour courant au format du champ date (AAAA-MM-JJ), fuseau local. */
const aujourdhui = (): string => {
  const maintenant = new Date();
  const mois = `${maintenant.getMonth() + 1}`.padStart(2, '0');
  const jour = `${maintenant.getDate()}`.padStart(2, '0');
  return `${maintenant.getFullYear()}-${mois}-${jour}`;
};

/**
 * Confirmation de la validation du dépôt final.
 *
 * Publier vaut adopter, et l'acte est sans retour : la modale dit ce qu'il
 * déclenche, et recueille la seule information que le dossier n'a pas encore —
 * la date de la délibération d'adoption, celle qui fait courir la validité.
 */
export const PublierDepotFinalModal = ({
  demarcheType,
  onConfirm,
  onClose,
}: Props) => {
  const [dateAdoption, setDateAdoption] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const typeLabels = { type: appLabels.demarcheTypeLabels[demarcheType] };

  // Une délibération déjà prise : une date future décrirait une adoption qui
  // n'a pas eu lieu.
  const valider = (): string | null => {
    if (!dateAdoption) {
      return appLabels.demarchePublierDateAdoptionRequise;
    }
    if (dateAdoption > aujourdhui()) {
      return appLabels.demarchePublierDateAdoptionFuture;
    }
    return null;
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
      title={appLabels.demarchePublierConfirmationTitre}
      dataTest="demarches.publier-confirmation-modal"
      render={() => (
        <div className="flex flex-col gap-4">
          <p className="m-0">
            {appLabels.demarchePublierConfirmationProcessus(typeLabels)}
          </p>
          <Field
            title={appLabels.demarchePublierDateAdoption}
            htmlFor={DATE_ADOPTION_FIELD_ID}
            state={erreur ? 'error' : 'default'}
            message={
              erreur ??
              appLabels.demarchePublierDateAdoptionAide({
                ...typeLabels,
                ans: DEMARCHE_PCAET_VALIDITE_ANS,
              })
            }
          >
            <Input
              id={DATE_ADOPTION_FIELD_ID}
              type="date"
              min="1900-01-01"
              max={aujourdhui()}
              aria-required="true"
              value={dateAdoption}
              onChange={(event) => {
                setDateAdoption(event.target.value);
                setErreur(null);
              }}
              state={erreur ? 'error' : 'default'}
              data-test="demarches.publier-date-adoption"
            />
          </Field>
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            children: appLabels.demarchePublierConfirmer,
            icon: 'arrow-right-line',
            iconPosition: 'right',
            disabled: !dateAdoption,
            onClick: () => {
              const message = valider();
              if (message) {
                setErreur(message);
                return;
              }
              onConfirm(dateAdoption);
              close();
            },
          }}
        />
      )}
    />
  );
};
