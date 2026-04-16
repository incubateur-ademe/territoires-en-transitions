import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { appLabels } from '@/app/labels/catalog';
import { Checkbox, Field, RichTextEditor } from '@tet/ui';
import { ChangeEvent } from 'react';
import {
  MesureAuditStatut,
  useGetMesureAuditStatut,
} from './use-get-mesure-audit-statut';
import { useUpdateMesureAuditStatut } from './use-update-mesure-audit-statut';
import { useAudit, useIsAuditeur } from './useAudit';

export type TActionAuditDetailProps = {
  action: ActionDefinitionSummary;
};

export type TActionAuditDetailBaseProps = {
  auditStatut: MesureAuditStatut;
  readonly: boolean;
};

export const ActionAuditDetailBase = (props: TActionAuditDetailBaseProps) => {
  const { auditStatut, readonly } = props;
  const { avis: avisInitial, ordreDuJour } = auditStatut;

  const { mutate: updateMesureAuditStatut } = useUpdateMesureAuditStatut();

  return (
    <div className="border border-grey-3 bg-white p-4 rounded-lg">
      <Field title={appLabels.notesAuditeur} hint={appLabels.notesAuditeurHint}>
        <RichTextEditor
          className="[&_.bn-block-content]:py-0 [&_.bn-inline-content]:text-sm [&_.bn-inline-content]:leading-[1.25rem]"
          initialValue={avisInitial}
          disabled={readonly}
          debounceDelayOnChange={1000}
          onChange={(value: string) => {
            updateMesureAuditStatut({
              collectiviteId: auditStatut.collectiviteId,
              mesureId: auditStatut.mesureId,
              avis: value,
            });
          }}
        />
      </Field>

      {!readonly && (
        <div className="mt-4">
          <Checkbox
            id="ordre_du_jour"
            label={appLabels.ajouterMesureOrdreDuJour}
            checked={ordreDuJour}
            onChange={(evt: ChangeEvent<HTMLInputElement>) => {
              updateMesureAuditStatut({
                collectiviteId: auditStatut.collectiviteId,
                mesureId: auditStatut.mesureId,
                ordreDuJour: evt.currentTarget.checked,
              });
            }}
          />
        </div>
      )}
    </div>
  );
};

export const ActionAuditDetail = (props: TActionAuditDetailProps) => {
  const { action } = props;

  const { data: audit } = useAudit();
  const isAuditeur = useIsAuditeur();

  const { data: auditStatut } = useGetMesureAuditStatut({
    mesureId: action.id,
    enabled: !!audit,
  });

  return audit && isAuditeur && auditStatut ? (
    <ActionAuditDetailBase
      auditStatut={auditStatut}
      readonly={!isAuditeur || audit.valide}
    />
  ) : null;
};
