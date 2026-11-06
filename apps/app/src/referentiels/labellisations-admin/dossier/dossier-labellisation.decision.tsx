'use client';

import { appLabels } from '@/app/labels/catalog';
import {
  canDecideDossierLabellisation,
  EtoileEnum,
} from '@tet/domain/referentiels';
import {
  Button,
  ButtonSize,
  Field,
  Input,
  Modal,
  ModalFooterOKCancel,
  Select,
  SplitButton,
} from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { useId, useState } from 'react';
import { format } from 'date-fns';
import {
  DossierLabellisation,
  useCloseDossierLabellisation,
} from '../data/use-dossiers-labellisation';
import {
  formatShortDate,
  formatEtoile,
  isAuditeurAAttribuer,
} from '../labellisations-admin.utils';
import { AuditeursEditor } from './dossier-labellisation.fields';
import { Etoiles } from '../labellisations-admin.etoiles';
import { ReferentielBadge } from '../labellisations-admin.referentiel-badge';
import { DossierSection } from './dossier-labellisation.section';

// Date locale : toISOString() donnerait la veille en début de nuit (UTC)
const today = () => format(new Date(), 'yyyy-MM-dd');

type CloseInput = Parameters<
  ReturnType<typeof useCloseDossierLabellisation>['mutate']
>[0];

/**
 * Décision sur le dossier, qui le clôt :
 * - audit de labellisation validé → étoile obtenue + date de CRA ;
 * - demande de 1ère étoile → valider ou refuser, sans audit ni score ;
 * - sinon (audit COT, abandon…) → clore.
 */
export const DossierLabellisationDecision = ({
  dossier,
}: {
  dossier: DossierLabellisation;
}) => {
  if (dossier.statut === 'clos') {
    return (
      <DossierSection title={appLabels.labellisationsAdminDossierClos}>
        {dossier.labellisationObtenueLe && dossier.labellisationEtoiles && (
          <div className="flex items-center gap-2 text-sm font-normal">
            <Etoiles etoiles={dossier.labellisationEtoiles} />
            {appLabels.labellisationsAdminLabelliseeLe(
              formatShortDate(dossier.labellisationObtenueLe) ?? ''
            )}
          </div>
        )}
      </DossierSection>
    );
  }

  return (
    <DossierSection
      title={appLabels.labellisationsAdminDecision}
      dataTest="referentiels.labellisations-admin.decision"
    >
      <DossierLabellisationDecisionActions dossier={dossier} />
    </DossierSection>
  );
};

const getDecisions = (dossier: DossierLabellisation) => {
  const rules = {
    audit: dossier,
    demande: dossier.demandeId
      ? { etoiles: dossier.etoiles, sujet: dossier.sujet }
      : null,
  };
  return {
    canLabelliser: canDecideDossierLabellisation(rules, 'labelliser'),
    canValiderPremiereEtoile: canDecideDossierLabellisation(
      rules,
      'valider_premiere_etoile'
    ),
  };
};

/**
 * Boutons de décision, utilisés dans la fiche et dans le tableau des dossiers.
 * Le tableau propose aussi d'attribuer un auditeur, que la fiche gère déjà
 * dans son encart Auditeurs.
 */
export const DossierLabellisationDecisionActions = ({
  dossier,
  size = 'sm',
  className,
  withAttribuerAuditeur = false,
}: {
  dossier: DossierLabellisation;
  size?: ButtonSize;
  className?: string;
  withAttribuerAuditeur?: boolean;
}) => {
  // Le libellé du bouton cliqué sert de titre à la modale de confirmation.
  const [decision, setDecision] = useState<{
    decision: CloseInput['decision'];
    label: string;
  } | null>(null);
  const [isAttribuerOpen, setIsAttribuerOpen] = useState(false);
  const { mutate: closeDossier, isPending } = useCloseDossierLabellisation();

  if (dossier.statut === 'clos') {
    return null;
  }
  const { canLabelliser, canValiderPremiereEtoile } = getDecisions(dossier);

  const clore = {
    label: appLabels.labellisationsAdminClore,
    onClick: () =>
      setDecision({
        decision: 'clore',
        label: appLabels.labellisationsAdminClore,
      }),
    disabled: isPending,
  };
  // L'action principale à un clic, la clôture sans labellisation derrière la
  // flèche. Sans action principale possible, il ne reste que la clôture.
  const principale = canLabelliser
    ? {
        onClick: () =>
          setDecision({
            decision: 'labelliser',
            label: appLabels.labellisationsAdminLabelliser,
          }),
        label: appLabels.labellisationsAdminLabelliser,
        dataTest: 'referentiels.labellisations-admin.decision-labelliser',
        secondaire: clore,
      }
    : canValiderPremiereEtoile
    ? {
        onClick: () =>
          setDecision({
            decision: 'valider_premiere_etoile',
            label: appLabels.labellisationsAdminValiderPremiereEtoile,
          }),
        label: appLabels.labellisationsAdminValiderPremiereEtoile,
        dataTest:
          'referentiels.labellisations-admin.decision-valider-premiere-etoile',
        secondaire: {
          ...clore,
          label: appLabels.labellisationsAdminRefuser,
          onClick: () =>
            setDecision({
              decision: 'clore',
              label: appLabels.labellisationsAdminRefuser,
            }),
        },
      }
    : withAttribuerAuditeur && isAuditeurAAttribuer(dossier)
    ? {
        onClick: () => setIsAttribuerOpen(true),
        label: appLabels.labellisationsAdminAttribuerAuditeur,
        dataTest: 'referentiels.labellisations-admin.attribuer-auditeur',
        secondaire: clore,
      }
    : null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {principale ? (
        <SplitButton
          size={size}
          disabled={isPending}
          dataTest={principale.dataTest}
          menuDataTest="referentiels.labellisations-admin.decision-menu"
          onClick={principale.onClick}
          menuActions={[principale.secondaire]}
        >
          {principale.label}
        </SplitButton>
      ) : (
        <Button
          size={size}
          variant="outlined"
          disabled={isPending}
          dataTest="referentiels.labellisations-admin.decision-clore"
          onClick={clore.onClick}
        >
          {clore.label}
        </Button>
      )}
      {decision && (
        <DecisionModal
          key={decision.decision}
          dossier={dossier}
          decision={decision.decision}
          title={decision.label}
          isPending={isPending}
          onConfirm={(input) =>
            closeDossier(input, { onSuccess: () => setDecision(null) })
          }
          onClose={() => setDecision(null)}
        />
      )}
      {isAttribuerOpen && (
        <Modal
          openState={{
            isOpen: true,
            setIsOpen: (isOpen) => !isOpen && setIsAttribuerOpen(false),
          }}
          title={appLabels.labellisationsAdminAttribuerAuditeur}
          size="sm"
          render={() => (
            <div className="flex flex-col gap-4">
              <DossierModalHeader dossier={dossier} />
              <AuditeursEditor dossier={dossier} isClos={false} />
            </div>
          )}
        />
      )}
    </div>
  );
};

/** Référentiel et collectivité du dossier, en tête des modales d'action. */
const DossierModalHeader = ({ dossier }: { dossier: DossierLabellisation }) => (
  <div className="flex items-center gap-2">
    <ReferentielBadge referentielId={dossier.referentielId} size="md" />
    <span className="text-lg font-bold text-primary-9">
      {dossier.collectiviteNom}
    </span>
  </div>
);

/**
 * Toute décision clôt le dossier : on la fait confirmer dans une modale, qui
 * porte aussi l'étoile et la date quand la décision en demande.
 */
const DecisionModal = ({
  dossier,
  decision,
  title,
  isPending,
  onConfirm,
  onClose,
}: {
  dossier: DossierLabellisation;
  decision: CloseInput['decision'];
  title: string;
  isPending: boolean;
  onConfirm: (input: CloseInput) => void;
  onClose: () => void;
}) => {
  const [etoiles, setEtoiles] = useState(Number(dossier.etoiles ?? 1));
  const [date, setDate] = useState(today);
  const dateId = useId();
  const { auditId } = dossier;

  const input: CloseInput =
    decision === 'labelliser'
      ? { auditId, decision, etoiles, dateCra: date }
      : decision === 'valider_premiere_etoile'
      ? { auditId, decision, date }
      : { auditId, decision: 'clore' };

  return (
    <Modal
      openState={{
        isOpen: true,
        setIsOpen: (isOpen) => !isOpen && onClose(),
      }}
      title={title}
      size="sm"
      render={() => (
        <div className="flex flex-col gap-4">
          <DossierModalHeader dossier={dossier} />
          <p className="m-0 text-sm text-grey-8">
            {appLabels.labellisationsAdminConfirmerDescription}
          </p>
          {decision === 'labelliser' && (
            <Field title={appLabels.labellisationsAdminEtoileObtenue}>
              <Select
                dataTest="referentiels.labellisations-admin.decision-etoile"
                options={Object.values(EtoileEnum).map((value) => ({
                  value,
                  label: formatEtoile(value),
                }))}
                values={etoiles}
                onChange={(value) => value && setEtoiles(Number(value))}
              />
            </Field>
          )}
          {decision !== 'clore' && (
            <Field
              title={
                decision === 'labelliser'
                  ? appLabels.labellisationsAdminDateCra
                  : appLabels.labellisationsAdminDate
              }
              htmlFor={dateId}
            >
              <Input
                id={dateId}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-test="referentiels.labellisations-admin.decision-date"
              />
            </Field>
          )}
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close, size: 'sm' }}
          btnOKProps={{
            size: 'sm',
            children: appLabels.labellisationsAdminConfirmer,
            disabled: isPending || (decision !== 'clore' && !date),
            onClick: () => onConfirm(input),
          }}
        />
      )}
    />
  );
};
