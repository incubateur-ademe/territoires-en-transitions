import {Controller, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {ModalFooterOKCancel} from '@tet/ui';
import {Field, FieldMessage} from '@tet/ui';
import {Input} from '@tet/ui';
import {FormSectionGrid} from '@tet/ui';
import {Checkbox} from '@tet/ui';
import {Select, SelectMultiple} from '@tet/ui';
import {Enums} from '@tet/api';
import {SignupDataStep4, SignupPropsWithState} from './type';

const ROLES: Array<{value: Enums<'membre_fonction'>; label: string}> = [
  {value: 'politique', label: 'Équipe politique'},
  {value: 'technique', label: 'Directions et services techniques'},
  {value: 'partenaire', label: 'Partenaire'},
  {value: 'conseiller', label: "Bureau d'études"},
];

const REFERENTIELS = [
  {value: 'cae', label: 'Climat Air Énergie'},
  {value: 'eci', label: 'Économie Circulaire'},
];

/** Gestionnaire d'état pour le formulaire de l'étape 4 */
const useSignupStep4 = () => {
  const validationSchema = z.object({
    collectivite_id: z.number({
      invalid_type_error: 'Sélectionnez une collectivité',
    }),
    referent: z.boolean().optional(),
    champ_intervention: z.array(z.string()),
    role: z.string({invalid_type_error: 'Sélectionnez un rôle'}),
    poste: z.string().optional(),
  });

  return useForm({
    resolver: zodResolver(validationSchema),
  });
};

/**
 * Affiche l'étape 4 du panneau de création de compte
 */
export const SignupStep4 = (props: SignupPropsWithState) => {
  const {
    collectivites,
    defaultValues,
    onFilterCollectivites,
    isLoading,
    error,
    onCancel,
    onSubmit,
    formState: {email},
  } = props;

  const {
    handleSubmit,
    register,
    setValue,
    control,
    watch,
    formState: {isValid, errors},
  } = useSignupStep4();

  const onSubmitForm = handleSubmit(data => {
    onSubmit({...(data as SignupDataStep4), email});
  });

  const referent = watch('referent');

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmitForm}>
      <FormSectionGrid>
        <Field
          className="md:col-span-2"
          title="Nom de la collectivité *"
          state={errors.collectivite_id ? 'error' : undefined}
          message={errors.collectivite_id?.message?.toString()}
        >
          <Controller
            name="collectivite_id"
            control={control}
            render={({field}) => {
              return (
                <Select
                  debounce={500}
                  options={collectivites}
                  values={field.value ? [field.value] : undefined}
                  isSearcheable
                  onSearch={onFilterCollectivites}
                  disabled={isLoading}
                  onChange={value => {
                    setValue(
                      field.name,
                      field.value === value ? null : (value as number),
                      {
                        shouldValidate: true,
                      },
                    );
                  }}
                />
              );
            }}
          />
        </Field>

        <Field
          title="Rôle *"
          state={errors.role ? 'error' : undefined}
          message={errors.role?.message?.toString()}
        >
          <Controller
            name="role"
            control={control}
            render={({field}) => (
              <Select
                dataTest="role"
                options={ROLES}
                values={field.value ? [field.value] : undefined}
                onChange={value => {
                  setValue(
                    field.name,
                    field.value === value ? null : (value as string),
                    {
                      shouldValidate: true,
                    },
                  );
                }}
              />
            )}
          />
        </Field>

        <Field
          title="Intitulé de poste"
          htmlFor="poste"
          state={errors.poste ? 'error' : undefined}
          message={errors.poste?.message?.toString()}
        >
          <Input id="poste" type="text" {...register('poste')} />
        </Field>
        <Checkbox
          containerClassname="md:col-span-2"
          label="Je suis référent.e dans le programme Territoire Engagé Transition Ecologique"
          {...register('referent')}
        />
        {referent && (
          <Field
            title="Référentiel du programme *"
            state={errors.champ_intervention ? 'error' : undefined}
            message={errors.champ_intervention?.message?.toString()}
          >
            <Controller
              name="champ_intervention"
              control={control}
              render={({field}) => (
                <SelectMultiple
                  multiple
                  dataTest="role"
                  options={REFERENTIELS}
                  values={field.value ? [field.value] : undefined}
                  onChange={({values}) => {
                    setValue(field.name, values, {
                      shouldValidate: true,
                    });
                  }}
                />
              )}
            />
          </Field>
        )}
      </FormSectionGrid>
      {!!error && (
        <FieldMessage messageClassName="mt-4" state="error" message={error} />
      )}
      <ModalFooterOKCancel
        btnCancelProps={{onClick: onCancel}}
        btnOKProps={{
          type: 'submit',
          disabled: !isValid || isLoading,
        }}
      />
    </form>
  );
};
