import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import React, {ChangeEvent, useState} from 'react';
import FormField from 'ui/shared/form/FormField';
import Textarea from 'ui/shared/form/Textarea';
import {TActionAuditStatut} from './types';
import {useActionAuditStatut} from './useActionAuditStatut';
import {useAudit, useIsAuditeur} from './useAudit';
import {useUpdateActionAuditStatut} from './useUpdateActionAuditStatut';

export type TActionAuditDetailProps = {
  action: ActionDefinitionSummary;
};

export type TActionAuditDetailBaseProps = {
  auditStatut: TActionAuditStatut;
  readonly: boolean;
  onChange: (data: {avis: string} | {ordre_du_jour: boolean}) => void;
};

/**
 * Affiche le détail de l'audit d'une action (notes, flag "inscrire à l'ordre du jour")
 */
export const ActionAuditDetailBase = (props: TActionAuditDetailBaseProps) => {
  const {auditStatut, readonly, onChange} = props;
  const {avis: avisInitial, ordre_du_jour} = auditStatut;
  const [avis, setAvis] = useState(avisInitial);

  return (
    <>
      <FormField
        label="Notes de l’auditeur, auditrice"
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
          onBlur={() => avis.trim() !== avisInitial && onChange({avis})}
          disabled={readonly}
        />
      </FormField>
      <div className="fr-checkbox-group fr-checkbox-inline">
        <input
          type="checkbox"
          id="ordre_du_jour"
          name="ordre_du_jour"
          checked={ordre_du_jour}
          disabled={readonly}
          onChange={(evt: ChangeEvent<HTMLInputElement>) =>
            onChange({ordre_du_jour: evt.target.checked})
          }
        />
        <label htmlFor="ordre_du_jour">
          Ajouter cette action à l’ordre du jour de la séance d’audit
        </label>
      </div>
    </>
  );
};

/**
 * Charge les données et fait le rendu
 */
export const ActionAuditDetail = (props: TActionAuditDetailProps) => {
  const {action} = props;

  // donnée de l'audit en cours (si il y en a un)
  const {data: audit} = useAudit();

  // indique si l'utilisateur courant est l'auditeur
  const isAuditeur = useIsAuditeur();

  // statut d'audit de l'action
  const {data: auditStatut} = useActionAuditStatut(action);

  // fonctions d'enregistrement des modifications
  const {mutate} = useUpdateActionAuditStatut();
  const handleChange: TActionAuditDetailBaseProps['onChange'] = data =>
    auditStatut && mutate({...auditStatut, ...data});

  return audit && auditStatut ? (
    <ActionAuditDetailBase
      auditStatut={auditStatut}
      readonly={!isAuditeur}
      onChange={handleChange}
    />
  ) : null;
};
