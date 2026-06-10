import { appLabels } from '@/app/labels/catalog';
import { BadgeAuditStatut } from './BadgeAuditStatut';

import { MesureAuditStatutEnum } from '@tet/domain/referentiels';
import { cn, Divider, Select } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';
import {
  MesureAuditStatut,
  useGetMesureAuditStatut,
} from './use-get-mesure-audit-statut';
import { useUpdateMesureAuditStatut } from './use-update-mesure-audit-statut';
import { useAudit, useIsAuditeur } from './useAudit';

export type TActionAuditStatutProps = {
  action: ActionListItem;
  className?: string;
};

type TActionAuditStatutBaseProps = {
  auditStatut: MesureAuditStatut;
  readonly: boolean;
  className?: string;
  onChange: (newStatut: MesureAuditStatutEnum) => void;
};

const options: { value: MesureAuditStatutEnum; label: string }[] = [
  { value: 'non_audite', label: appLabels.auditNonAudite },
  { value: 'en_cours', label: appLabels.auditEnCours },
  { value: 'audite', label: appLabels.auditAudite },
];

export const ActionAuditStatutBase = (props: TActionAuditStatutBaseProps) => {
  const { auditStatut, readonly, className, onChange } = props;
  const { statut } = auditStatut;
  return readonly ? (
    <div data-test="action-audit-statut-ro" className={className}>
      <BadgeAuditStatut statut={statut} />
    </div>
  ) : (
    <div className={className}>
      <Select
        dataTest="action-audit-statut"
        values={statut}
        options={options}
        onChange={(v) => v && onChange(v as MesureAuditStatutEnum)}
        dropdownZindex={100}
        custom={{
          renderOptionItem: (v) => (
            <BadgeAuditStatut statut={v.value as MesureAuditStatutEnum} />
          ),
          triggerButton: {
            button: (
              <button type="button">
                <BadgeAuditStatut statut={statut} />
              </button>
            ),
          },
        }}
      />
    </div>
  );
};

const ActionAuditStatut = ({ action, className }: TActionAuditStatutProps) => {
  const { data: audit } = useAudit();
  const isAuditeur = useIsAuditeur();

  const { data: auditStatut } = useGetMesureAuditStatut({
    mesureId: action.actionId,
    enabled: !!audit,
  });

  const { mutate: updateMesureAuditStatut } = useUpdateMesureAuditStatut();

  return audit && auditStatut ? (
    <>
      <Divider orientation="vertical" className="h-5" />
      <ActionAuditStatutBase
        className={cn('-m-1', className)}
        auditStatut={auditStatut}
        readonly={!isAuditeur || audit?.valide}
        onChange={(statut: MesureAuditStatutEnum) =>
          updateMesureAuditStatut({
            collectiviteId: auditStatut.collectiviteId,
            mesureId: auditStatut.mesureId,
            statut,
          })
        }
      />
    </>
  ) : null;
};

export default ActionAuditStatut;
