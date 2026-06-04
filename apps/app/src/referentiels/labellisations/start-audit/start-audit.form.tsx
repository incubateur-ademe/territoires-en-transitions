import { appLabels } from '@/app/labels/catalog';
import { zodResolver } from '@hookform/resolvers/zod';
import { Etoile, SujetDemandeEnum } from '@tet/domain/referentiels';
import { ModalFooterOKCancel, VisibleWhen } from '@tet/ui';
import { ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  AuditSelection,
  AuditSelectionDraft,
  auditSelectionSchema,
  defaultRequestableStar,
  MINIMUM_REQUESTABLE_AUDIT_STAR,
} from './audit-selection';
import { AuditTypeField } from './audit-type.field';
import { availableAuditTypes } from './available-audit.types';
import { TargetStarField } from './target-star.field';

type StartAuditFormProps = {
  canAskCOTLabellisation: boolean;
  labellisable: boolean;
  maximumPossibleStarToRequest: Etoile;
  isPending: boolean;
  onSubmit: (selection: AuditSelection) => void;
  onCancel: () => void;
};

export const StartAuditForm = ({
  canAskCOTLabellisation,
  labellisable,
  maximumPossibleStarToRequest,
  isPending,
  onSubmit,
  onCancel,
}: StartAuditFormProps): ReactNode => {
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { isValid },
  } = useForm<AuditSelectionDraft, unknown, AuditSelection>({
    resolver: zodResolver(auditSelectionSchema),
    mode: 'onChange',
    defaultValues: {
      sujet: canAskCOTLabellisation ? null : SujetDemandeEnum.LABELLISATION,
      targetStar: defaultRequestableStar(maximumPossibleStarToRequest),
    },
  });

  const sujet = useWatch({ control, name: 'sujet' });
  const auditTypeOptions = availableAuditTypes({
    labellisable,
    canTargetAuditStar:
      maximumPossibleStarToRequest >= MINIMUM_REQUESTABLE_AUDIT_STAR,
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <VisibleWhen condition={canAskCOTLabellisation}>
        <Controller
          name="sujet"
          control={control}
          render={({ field }) => (
            <AuditTypeField
              options={auditTypeOptions}
              value={field.value}
              onChange={(nextSujet) => {
                field.onChange(nextSujet);
                // l'étoile n'a pas de sens pour un audit COT seul → remise à
                // null. Pour une variante labellisante, on ne pose l'étoile par
                // défaut que si aucune n'est choisie, afin de préserver une
                // sélection explicite de l'utilisateur.
                if (nextSujet === SujetDemandeEnum.COT) {
                  setValue('targetStar', null, { shouldValidate: true });
                } else if (!getValues('targetStar')) {
                  setValue(
                    'targetStar',
                    defaultRequestableStar(maximumPossibleStarToRequest),
                    { shouldValidate: true }
                  );
                }
              }}
            />
          )}
        />
      </VisibleWhen>
      <VisibleWhen condition={sujet !== SujetDemandeEnum.COT}>
        <Controller
          name="targetStar"
          control={control}
          render={({ field }) => (
            <TargetStarField
              maximumPossibleStarToRequest={maximumPossibleStarToRequest}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </VisibleWhen>
      <ModalFooterOKCancel
        btnOKProps={{
          type: 'submit',
          disabled: !isValid || isPending,
          children: appLabels.envoyerMaDemande,
        }}
        btnCancelProps={{ onClick: onCancel }}
      />
    </form>
  );
};
