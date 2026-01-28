import { Icon, RichTextEditor, Spacer } from '@tet/ui';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useFicheContext } from '../../context/fiche-context';

type RessourcesFinancementsFormValues = {
  ressources: string | null | undefined;
  financements: string | null | undefined;
};

const Field = ({
  icon,
  label,
  value,
  isReadonly,
  onChange,
}: {
  icon: string;
  label: string;
  value: string;
  isReadonly: boolean;
  onChange: (value: string) => void;
}) => {
  // RichTextEditor behaves strangely when controlled hence
  // only the initial value is used on first mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialValue = useMemo(() => value, []);
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon icon={icon} className="text-grey-8" size="sm" />
        <div className="text-grey-8 text-sm">{label}</div>
      </div>
      <div className="w-full py-2">
        <RichTextEditor
          unstyled
          disabled={isReadonly}
          initialValue={initialValue}
          onChange={onChange}
          contentStyle={{
            size: 'sm',
            color: 'primary',
          }}
        />
      </div>
    </div>
  );
};
export const RessourcesFinancementsView = () => {
  const { update, fiche, isReadonly } = useFicheContext();
  const { watch, control } = useForm<RessourcesFinancementsFormValues>({
    defaultValues: {
      ressources: fiche.ressources,
      financements: fiche.financements,
    },
  });

  useEffect(() => {
    const subscription = watch((formValues) => {
      update({
        ficheId: fiche.id,
        ficheFields: {
          ressources: formValues.ressources,
          financements: formValues.financements,
        },
      });
    });
    return () => subscription.unsubscribe();
  }, [watch, update, fiche.id]);

  return (
    <>
      <Controller
        control={control}
        name="financements"
        render={({ field }) => (
          <Field
            icon="bank-line"
            isReadonly={isReadonly}
            label="Financements"
            value={field.value ?? ''}
            onChange={field.onChange}
          />
        )}
      />
      <Spacer height={1} />
      <Controller
        control={control}
        name="ressources"
        render={({ field }) => (
          <Field
            icon="shield-user-line"
            isReadonly={isReadonly}
            label="Moyens humains et techniques"
            value={field.value ?? ''}
            onChange={field.onChange}
          />
        )}
      />
    </>
  );
};
