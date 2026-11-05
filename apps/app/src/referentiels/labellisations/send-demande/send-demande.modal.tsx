import { appLabels } from '@/app/labels/catalog';
import {
  DemandeVisee,
  toSendDemandeInput,
} from '@/app/referentiels/audit-labellisation/demande-visee';
import { useToastContext } from '@/app/utils/toast/toast-context';
import {
  Etoile,
  etoileEnumValues,
  EtoileEnum,
  ReferentielId,
  SujetDemandeEnum,
} from '@tet/domain/referentiels';
import { Icon, Modal, ModalFooterOKCancel, VisibleWhen } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { ReactNode } from 'react';
import { match } from 'ts-pattern';
import { useRequestLabellisation } from '../data/use-request-labellisation';
import { numLabels } from '../numLabels';

type SendDemandeTarget = {
  collectiviteId: number;
  referentiel: ReferentielId;
  demande: DemandeVisee;
};

type DemandeRecapitulatif = {
  titre: string;
  detail: string | null;
  suite: string | null;
};

const toSendDemandeTitle = (demande: DemandeVisee): string =>
  demande.kind === 'premiere-etoile'
    ? appLabels.confirmerDemandePremiereEtoile
    : appLabels.confirmerDemandeAudit;

const toDemandeRecapitulatif = (demande: DemandeVisee): DemandeRecapitulatif =>
  match(demande)
    .returnType<DemandeRecapitulatif>()
    .with({ kind: 'premiere-etoile' }, () => ({
      titre: appLabels.demandePremiereEtoileLabel,
      detail: appLabels.demandePremiereEtoileSansAudit,
      suite: appLabels.bravoConditionsPremiereEtoile,
    }))
    .with({ kind: 'audit-labellisation' }, ({ sujet, etoile }) => ({
      titre:
        sujet === SujetDemandeEnum.LABELLISATION_COT
          ? appLabels.demarrerAuditTypeCotAvecLabellisation
          : appLabels.demarrerAuditTypeLabellisation,
      detail: appLabels.demarrerAuditEtoileDemandee({
        etoileLabel: numLabels[etoile],
      }),
      suite: null,
    }))
    .with({ kind: 'audit-cot' }, () => ({
      titre: appLabels.auditCotSansLabellisation,
      detail: null,
      suite: null,
    }))
    .exhaustive();

const toEtoileDemandee = (demande: DemandeVisee): Etoile | null =>
  match(demande)
    .returnType<Etoile | null>()
    .with({ kind: 'premiere-etoile' }, () => EtoileEnum.PREMIERE_ETOILE)
    .with({ kind: 'audit-labellisation' }, ({ etoile }) => etoile)
    .with({ kind: 'audit-cot' }, () => null)
    .exhaustive();

const toSendDemandeSuccess = (demande: DemandeVisee): string =>
  demande.kind === 'premiere-etoile'
    ? appLabels.demandeLabellisationEnvoyee
    : appLabels.demandeAuditEnvoyee;

const EtoilesDemandees = ({ etoile }: { etoile: Etoile }): ReactNode => (
  <span aria-hidden="true" className="flex shrink-0 items-center gap-0.5">
    {etoileEnumValues.map((star) => (
      <Icon
        key={star}
        icon={star <= etoile ? 'star-fill' : 'star-line'}
        size="lg"
        className="text-primary-9"
      />
    ))}
  </span>
);

const DemandeIllustration = ({
  demande,
}: {
  demande: DemandeVisee;
}): ReactNode => {
  const etoile = toEtoileDemandee(demande);
  if (etoile === null) {
    return (
      <Icon
        aria-hidden="true"
        icon="file-search-line"
        size="xl"
        className="shrink-0 text-primary-9"
      />
    );
  }
  return <EtoilesDemandees etoile={etoile} />;
};

const DemandeRecapitulatifCard = ({
  demande,
}: {
  demande: DemandeVisee;
}): ReactNode => {
  const { titre, detail } = toDemandeRecapitulatif(demande);
  return (
    <div className="flex items-center gap-4 rounded-lg border border-primary-3 bg-primary-1 p-4">
      <DemandeIllustration demande={demande} />
      <div className="flex flex-col gap-1">
        <span className="font-bold text-primary-9">{titre}</span>
        <VisibleWhen condition={detail !== null}>
          <span className="text-sm text-grey-8">{detail}</span>
        </VisibleWhen>
      </div>
    </div>
  );
};

const SendDemandeModalContent = ({
  collectiviteId,
  referentiel,
  demande,
  onClose,
}: SendDemandeTarget & { onClose: () => void }): ReactNode => {
  const { setToast } = useToastContext();
  const { mutate, isPending } = useRequestLabellisation();

  const sendDemande = (): void =>
    mutate(toSendDemandeInput({ collectiviteId, referentiel }, demande), {
      onSuccess: () => {
        setToast('success', toSendDemandeSuccess(demande));
        onClose();
      },
      onError: (error) => setToast('error', error.message),
    });

  const { suite } = toDemandeRecapitulatif(demande);

  return (
    <div className="flex flex-col gap-6">
      <DemandeRecapitulatifCard demande={demande} />
      <VisibleWhen condition={suite !== null}>
        <p className="m-0 text-sm text-grey-8">{suite}</p>
      </VisibleWhen>
      <ModalFooterOKCancel
        btnOKProps={{
          onClick: sendDemande,
          disabled: isPending,
          icon: 'send-plane-line',
          iconPosition: 'right',
          children: appLabels.envoyerMaDemande,
        }}
        btnCancelProps={{ onClick: onClose }}
      />
    </div>
  );
};

const SendDemandeModal = ({
  openState,
  ...target
}: SendDemandeTarget & { openState: OpenState }): ReactNode => (
  <Modal
    openState={openState}
    title={toSendDemandeTitle(target.demande)}
    size="md"
    render={({ close }) => (
      <SendDemandeModalContent {...target} onClose={close} />
    )}
  />
);

export { SendDemandeModal, SendDemandeModalContent };
