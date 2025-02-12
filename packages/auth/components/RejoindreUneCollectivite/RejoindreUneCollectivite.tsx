import { Enums } from '@/api';
import {
  Accordion,
  ACCORDION_CONTENT_STYLE,
  Checkbox,
  Field,
  FieldMessage,
  FormSectionGrid,
  Input,
  ModalFooterOKCancel,
  Select,
  SelectMultiple,
  TrackPageView,
  useEventTracker,
} from '@/ui';
import { useState } from 'react';
import { CollectiviteSelectionnee } from './CollectiviteSelectionnee';
import {
  RejoindreUneCollectiviteData,
  RejoindreUneCollectiviteProps,
} from './type';

const ROLES: Array<{ value: Enums<'membre_fonction'>; label: string }> = [
  { value: 'politique', label: 'Équipe politique' },
  { value: 'technique', label: 'Directions et services techniques' },
  { value: 'partenaire', label: 'Partenaire' },
  { value: 'conseiller', label: "Bureau d'études" },
];

const REFERENTIELS = [
  { value: 'cae', label: 'Climat Air Énergie' },
  { value: 'eci', label: 'Économie Circulaire' },
];

/**
 * Affiche le formulaire permettant de rejoindre une collectivité
 */
export const RejoindreUneCollectivite = (
  props: RejoindreUneCollectiviteProps
) => {
  const {
    collectivites,
    collectiviteSelectionnee,
    onFilterCollectivites,
    onSelectCollectivite,
    isLoading,
    error,
    onCancel,
    onSubmit,
  } = props;

  const [formState, setFormState] = useState<
    Omit<RejoindreUneCollectiviteData, 'collectiviteId'>
  >({});
  const { est_referent, poste, role, champ_intervention } = formState;
  const { id: collectiviteId, contacts } = collectiviteSelectionnee || {};

  const hasContacts = !!contacts?.length;
  const isValid =
    collectiviteId &&
    !hasContacts &&
    role &&
    (!est_referent || champ_intervention?.length);

  const eventTracker = useEventTracker('auth/rejoindre-une-collectivite');
  return (
    <>
      <TrackPageView pageName="auth/rejoindre-une-collectivite" />
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (isValid) {
            onSubmit({ ...formState, collectiviteId });
            // @ts-expect-error en attendant de gérer le 2ème argument optionnel
            eventTracker('cta_submit', {});
          }
        }}
      >
        <FormSectionGrid>
          <Field
            className="md:col-span-2"
            title="Nom de la collectivité *"
            hint="pas besoin de saisir CC ou Communauté de communes pour les intercommunalités par exemple"
          >
            <Select
              dataTest="select-collectivite"
              placeholder="Renseignez le nom et sélectionnez votre collectivité"
              debounce={500}
              options={
                collectivites?.map((c) => ({
                  value: c.collectivite_id,
                  label: c.nom,
                })) || []
              }
              values={collectiviteId ? collectiviteId : undefined}
              isSearcheable
              onSearch={onFilterCollectivites}
              isLoading={isLoading}
              onChange={(value) => {
                const id = collectiviteId === value ? null : (value as number);
                onSelectCollectivite(id);
              }}
            />
            <Accordion
              title="Aide"
              icon="question-line"
              iconPosition="right"
              content={
                <div className={ACCORDION_CONTENT_STYLE}>
                  <div className="italic mb-2">
                    Vous ne trouvez pas la collectivité que vous recherchez ?
                  </div>
                  <div>
                    Envoyez un email à{' '}
                    <a href="mailto:contact@territoiresentransitions.fr">
                      contact@territoiresentransitions.fr
                    </a>{' '}
                    avec le nom de la collectivité et son numéro SIREN pour que
                    nous puissions vous aider.
                  </div>
                </div>
              }
            />

            {hasContacts && (
              <CollectiviteSelectionnee
                collectivite={collectiviteSelectionnee}
              />
            )}
          </Field>
          {!hasContacts && (
            <>
              <Field title="Rôle *">
                <Select
                  dataTest="role"
                  options={ROLES}
                  values={role ? [role] : undefined}
                  onChange={(value) => {
                    setFormState((previous) => ({
                      ...previous,
                      role:
                        role === value
                          ? null
                          : (value as RejoindreUneCollectiviteData['role']),
                    }));
                  }}
                />
              </Field>
              <Field title="Intitulé de poste" htmlFor="poste">
                <Input
                  id="poste"
                  type="text"
                  value={poste}
                  onChange={(e) =>
                    setFormState((previous) => ({
                      ...previous,
                      poste: e.target.value,
                    }))
                  }
                />
              </Field>
              <Checkbox
                containerClassname="md:col-span-2"
                label="Je suis référent.e dans le programme Territoire Engagé Transition Ecologique"
                checked={est_referent}
                onChange={(e) =>
                  setFormState((previous) => ({
                    ...previous,
                    est_referent: e.target.checked,
                  }))
                }
              />
              {est_referent && (
                <Field title="Référentiel du programme *">
                  <SelectMultiple
                    multiple
                    dataTest="role"
                    options={REFERENTIELS}
                    values={champ_intervention}
                    onChange={({ values }) => {
                      setFormState((previous) => ({
                        ...previous,
                        champ_intervention:
                          values as RejoindreUneCollectiviteData['champ_intervention'],
                      }));
                    }}
                  />
                </Field>
              )}
            </>
          )}
        </FormSectionGrid>
        {!!error && (
          <FieldMessage messageClassName="mt-4" state="error" message={error} />
        )}
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: onCancel }}
          btnOKProps={{
            type: 'submit',
            disabled: !isValid || isLoading,
          }}
        />
      </form>
    </>
  );
};
