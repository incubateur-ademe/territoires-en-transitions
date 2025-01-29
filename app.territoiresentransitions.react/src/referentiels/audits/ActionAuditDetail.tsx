import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import Textarea from '@/app/ui/shared/form/Textarea';
import { Field } from '@/ui';
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
    <div className="fr-mt-2w">
      <Field
        className="mb-6"
        title="Notes de l’auditeur, auditrice"
        hint="Remarques sur l’action, questions pour la séance d’audit"
      >
        <Textarea
          data-test="avis"
          className="fr-input !outline-none"
          value={avis}
          onInputChange={() => null}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
            setAvis(event.currentTarget.value)
          }
          onBlur={() => {
            onChange({ ...auditStatut, avis: avis.trim() });
          }}
          disabled={readonly}
        />
      </Field>
      <div className="fr-checkbox-group fr-checkbox-inline">
        <input
          type="checkbox"
          id="ordre_du_jour"
          name="ordre_du_jour"
          checked={ordre_du_jour}
          disabled={readonly}
          onChange={(evt: ChangeEvent<HTMLInputElement>) => {
            onChange({
              avis,
              ordre_du_jour: evt.currentTarget.checked,
            });
          }}
        />
        <label htmlFor="ordre_du_jour">
          Ajouter cette action à l’ordre du jour de la séance d’audit
        </label>
      </div>
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
