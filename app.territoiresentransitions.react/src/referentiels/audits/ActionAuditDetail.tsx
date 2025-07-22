import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { Checkbox, Field, Textarea } from '@/ui';
import React, { ChangeEvent, useState } from 'react';
import { TActionAuditStatut } from './types';
import { useActionAuditStatut } from './useActionAuditStatut';
import { useAudit, useIsAuditeur } from './useAudit';
import { useUpdateActionAuditStatut } from './useUpdateActionAuditStatut';

export type TActionAuditDetailProps = {
  action: ActionDefinitionSummary;
};

export type TActionAuditDetailBaseProps = {
  auditStatut: TActionAuditStatut;
  readonly: boolean;
  onChange: (data: { avis: string; ordre_du_jour: boolean }) => void;
};

/**
 * Affiche le détail de l'audit d'une action (notes, flag "inscrire à l'ordre du jour")
 */
export const ActionAuditDetailBase = (props: TActionAuditDetailBaseProps) => {
  const { auditStatut, readonly, onChange } = props;
  const { avis: avisInitial, ordre_du_jour } = auditStatut;
  const [avis, setAvis] = useState(avisInitial);

  return (
    <div className="mt-8 border border-grey-3 bg-white p-4 rounded-lg">
      <Field
        title="Notes de l’auditeur, auditrice"
        hint="Remarques sur la mesure, questions pour la séance d’audit"
      >
        <Textarea
          dataTest="avis"
          value={avis}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
            setAvis(event.currentTarget.value)
          }
          onBlur={() => {
            onChange({ ...auditStatut, avis: avis.trim() });
          }}
          disabled={readonly}
          rows={5}
        />
      </Field>

      {!readonly && (
        <div className="mt-4">
          <Checkbox
            id="ordre_du_jour"
            label="Ajouter cette mesure à l’ordre du jour de la séance d’audit"
            checked={ordre_du_jour}
            onChange={(evt: ChangeEvent<HTMLInputElement>) => {
              onChange({
                avis,
                ordre_du_jour: evt.currentTarget.checked,
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
  const { data: auditStatut } = useActionAuditStatut(action);

  // fonctions d'enregistrement des modifications
  const { mutate } = useUpdateActionAuditStatut();
  const handleChange: TActionAuditDetailBaseProps['onChange'] = (data) =>
    auditStatut && mutate({ ...auditStatut, ...data });

  return audit && auditStatut ? (
    <ActionAuditDetailBase
      auditStatut={auditStatut}
      readonly={!isAuditeur || audit?.valide}
      onChange={handleChange}
    />
  ) : null;
};
