import { appLabels } from '@/app/labels/catalog';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  availableAuditTypes,
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

type StartAuditFormProps = {
  isCOT: boolean;
  canRequestLabellisation: boolean;
  maximumRequestableStar: Etoile;
  isPending: boolean;
  onSubmit: (selection: AuditSelection) => void;
  onCancel: () => void;
};

export const StartAuditForm = ({
  isCOT,
  canRequestLabellisation,
  maximumRequestableStar,
  isPending,
  onSubmit,
  onCancel,
}: StartAuditFormProps): ReactNode => {
  const auditTypes = availableAuditTypes({ isCOT, canRequestLabellisation });
  const hasAuditTypeChoice = auditTypes.length > 1;
  const [onlyAuditType] = auditTypes;

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
      sujet: hasAuditTypeChoice ? null : onlyAuditType ?? null,
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
              options={auditTypes}
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
