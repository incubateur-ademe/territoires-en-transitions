import { appLabels } from '@/app/labels/catalog';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AuditTypeOption,
  Etoile,
  SujetDemande,
  SujetDemandeEnum,
} from '@tet/domain/referentiels';
import { ModalFooterOKCancel, VisibleWhen } from '@tet/ui';
import { ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  AuditSelection,
  AuditSelectionDraft,
  auditSelectionSchema,
  defaultRequestableStar,
} from './audit-selection';
import { AuditTypeField } from './audit-type.field';
import { TargetStarField } from './target-star.field';

const isLabellisationSujet = (sujet: SujetDemande | null): boolean =>
  sujet === SujetDemandeEnum.LABELLISATION ||
  sujet === SujetDemandeEnum.LABELLISATION_COT;

type RequestAuditFormProps = {
  auditTypeOptions: readonly AuditTypeOption[];
  maximumRequestableStar: Etoile;
  isPending: boolean;
  onSubmit: (selection: AuditSelection) => void;
  onCancel: () => void;
};

export const RequestAuditForm = ({
  auditTypeOptions,
  maximumRequestableStar,
  isPending,
  onSubmit,
  onCancel,
}: RequestAuditFormProps): ReactNode => {
  const hasAuditTypeChoice = auditTypeOptions.length > 1;
  const [onlyAuditTypeOption] = auditTypeOptions;

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
      sujet: hasAuditTypeChoice ? null : onlyAuditTypeOption?.sujet ?? null,
      targetStar: defaultRequestableStar(maximumRequestableStar),
    },
  });

  const sujet = useWatch({ control, name: 'sujet' });

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <VisibleWhen condition={hasAuditTypeChoice}>
        <Controller
          name="sujet"
          control={control}
          render={({ field }) => (
            <AuditTypeField
              options={auditTypeOptions}
              value={field.value}
              onChange={(nextSujet) => {
                field.onChange(nextSujet);
                if (nextSujet === SujetDemandeEnum.COT) {
                  setValue('targetStar', null, { shouldValidate: true });
                } else if (!getValues('targetStar')) {
                  setValue(
                    'targetStar',
                    defaultRequestableStar(maximumRequestableStar),
                    { shouldValidate: true }
                  );
                }
              }}
            />
          )}
        />
      </VisibleWhen>
      <VisibleWhen condition={isLabellisationSujet(sujet)}>
        <Controller
          name="targetStar"
          control={control}
          render={({ field }) => (
            <TargetStarField
              maximumRequestableStar={maximumRequestableStar}
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
