import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { Checkbox, Field, RichTextEditor } from '@/ui';
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

/**
 * Affiche le détail de l'audit d'une action (notes, flag "inscrire à l'ordre du jour")
 */
export const ActionAuditDetailBase = (props: TActionAuditDetailBaseProps) => {
  const { auditStatut, readonly } = props;
  const { avis: avisInitial, ordreDuJour } = auditStatut;

  const { mutate: updateMesureAuditStatut } = useUpdateMesureAuditStatut();

  return (
    <div className="mt-8 border border-grey-3 bg-white p-4 rounded-lg">
      <Field
        title="Notes de l’auditeur, auditrice"
        hint="Remarques sur la mesure, questions pour la séance d’audit"
      >
        <RichTextEditor
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
            label="Ajouter cette mesure à l’ordre du jour de la séance d’audit"
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

/**
 * Charge les données et fait le rendu
 */
export const ActionAuditDetail = (props: TActionAuditDetailProps) => {
  const { action } = props;

  // donnée de l'audit en cours (si il y en a un)
  const { data: audit } = useAudit();

  // indique si l'utilisateur courant est l'auditeur
  const isAuditeur = useIsAuditeur();

  // statut d'audit de l'action
  const { data: auditStatut } = useGetMesureAuditStatut({
    mesureId: action.id,
    enabled: !!audit,
  });

  return audit && auditStatut ? (
    <ActionAuditDetailBase
      auditStatut={auditStatut}
      readonly={!isAuditeur || audit.valide}
    />
  ) : null;
};
