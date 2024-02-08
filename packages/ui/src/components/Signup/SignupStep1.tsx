import {Controller} from 'react-hook-form';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Tab, Tabs} from '@design-system/Tabs';
import {ModalFooterOKCancel} from '@design-system/Modal';
import {Field} from '@design-system/Field';
import {Input} from '@design-system/Input';
import {Checkbox} from '@design-system/Checkbox';
import {Select} from '@design-system/Select';
import {Button} from '@design-system/Button';
import {SignupDataStep1, SignupPropsWithState} from './type';
import {useState} from 'react';

const URL_CGU = 'https://territoiresentransitions.fr/cgu';
const URL_DCP = 'https://www.ademe.fr/donnees-personnelles/';

/** Gestionnaire d'état pour le formulaire de l'étape 1 */
const useSignupStep1 = (
  isPasswordless: boolean,
  defaultValues: SignupDataStep1
) => {
  const validationSchema = z.object({
    collectivite_id: z.number({
      invalid_type_error: 'Sélectionnez une collectivité',
    }),
    email: z.string().email({message: 'Un email valide est requis'}),
    password: z
      .string()
      .refine(value => (isPasswordless ? true : value.length >= 8), {
        message: 'Le mot de passe doit comporter au moins 8 caractères',
      }),
    cgu_acceptees: z.boolean().refine(value => !!value, {
      message: "Vous devez accepter le cadre d'utilisation de la plateforme",
    }),
    collectivite_engagee: z.boolean().optional(),
  });

  return useForm({
    reValidateMode: 'onChange',
    resolver: zodResolver(validationSchema),
    defaultValues: defaultValues || {
      collectivite_id: null,
      password: '',
      email: '',
      cgu_acceptees: false,
      collectivite_engagee: false,
    },
  });
};

/**
 * Affiche l'étape 1 du panneau de création de compte
 */
export const SignupStep1 = (props: SignupPropsWithState) => {
  const {signupState, withPassword} = props;
  const {formData} = signupState;
  const [isPasswordless, setIsPasswordless] = useState(!withPassword);
  const form = useSignupStep1(isPasswordless, formData);

  return (
    <Tabs
      className="justify-center"
      defaultActiveTab={isPasswordless ? 0 : 1}
      onChange={activeTab => {
        if (activeTab === 0) {
          // reset le champ mdp qui peut être rempli quand on passe d'un onglet à l'autre
          form.setValue('password', '');
          setIsPasswordless(true);
        } else {
          setIsPasswordless(false);
        }
      }}
    >
      <Tab label="Compte sans mot de passe">
        <SignupStep1Form {...props} form={form} isPasswordless />
      </Tab>
      <Tab label="Compte avec mot de passe">
        <SignupStep1Form {...props} form={form} />
      </Tab>
    </Tabs>
  );
};

/**
 * Affiche le formulaire pour l'étape 1 de la création de compte
 */
const SignupStep1Form = (
  props: SignupPropsWithState & {
    form: ReturnType<typeof useSignupStep1>;
    isPasswordless?: boolean;
  }
) => {
  const {
    isLoading,
    isPasswordless,
    collectivites,
    onFilterCollectivites,
    onCancel,
    form,
    signupState: {setFormData, setView},
  } = props;
  const {
    handleSubmit,
    control,
    register,
    setValue,
    formState: {isValid, errors},
  } = form;

  // enregistre les valeurs et passe à l'étape suivante
  const onSubmit = data => {
    setFormData(data);
    setView('etape2');
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <Field
        title="Nom de la collectivité"
        state={errors.collectivite_id ? 'error' : undefined}
        message={errors.collectivite_id?.message.toString()}
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
                    }
                  );
                }}
              />
            );
          }}
        />
      </Field>
      <Field
        title="Email de connexion"
        htmlFor="email"
        state={errors.email ? 'error' : undefined}
        message={errors.email?.message.toString()}
      >
        <Input id="email" type="text" {...register('email')} />
      </Field>
      {!isPasswordless && (
        <Field
          title="Mot de passe"
          htmlFor="password"
          state={errors.password ? 'error' : undefined}
          message={errors.password?.message.toString()}
        >
          <Input id="password" type="password" {...register('password')} />
        </Field>
      )}
      <hr className="mt-5" />
      <Checkbox
        className="font-medium"
        label="J’accepte le cadre d’utilisation de la plateforme (obligatoire)"
        message={
          <>
            <Button variant="underlined" size="sm" href={URL_CGU}>
              Les conditions générales
            </Button>
            <span className="text-sm mx-2">|</span>
            <Button variant="underlined" size="sm" href={URL_DCP}>
              la politique de protection des données de l'ADEME
            </Button>
          </>
        }
        {...register('cgu_acceptees')}
      />
      <Checkbox
        label="Collectivité engagée dans le programme Territoire Engagé Transition Ecologique"
        {...register('collectivite_engagee')}
      />
      <ModalFooterOKCancel
        btnCancelProps={{onClick: onCancel}}
        btnOKProps={{
          onClick: handleSubmit(onSubmit),
          disabled: !isValid,
          children: "Passer à l'étape 2",
          icon: 'arrow-right-line',
          iconPosition: 'right',
        }}
      />
    </form>
  );
};
