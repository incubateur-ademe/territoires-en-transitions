'use client';

import { makeCollectiviteDemarchePcaetDetailUrl } from '@/app/app/paths';
import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { createDemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import { appLabels } from '@/app/labels/catalog';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import { Button, Field, InfoTooltip, Input, Select, Textarea } from '@tet/ui';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const createDemarchePcaetSchema = z.object({
  titre: z.string().min(1, appLabels.demarchePcaetCreerIntituleRequis),
  obligation: z.enum(['obligatoire', 'volontaire']),
  pilotes: z
    .array(z.custom<PersonneTagOrUser>())
    .min(1, appLabels.demarchePcaetCreerPilotesRequis),
  description: z.string(),
});

type CreateDemarchePcaetForm = z.infer<typeof createDemarchePcaetSchema>;

export const CreateDemarchePcaetPage = () => {
  const router = useRouter();
  const { collectiviteId } = useCurrentCollectivite();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateDemarchePcaetForm>({
    resolver: zodResolver(createDemarchePcaetSchema),
    mode: 'onChange',
    defaultValues: {
      titre: 'PCAET réglementaire',
      obligation: 'obligatoire',
      pilotes: [],
      description: '',
    },
  });

  const onSubmit = (data: CreateDemarchePcaetForm) => {
    const demarche = createDemarchePcaet({
      collectiviteId,
      titre: data.titre,
      description: data.description,
      obligation: data.obligation,
      pilotes: data.pilotes,
    });
    router.push(
      makeCollectiviteDemarchePcaetDetailUrl({
        collectiviteId,
        demarchePcaetId: demarche.id,
      })
    );
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 py-8">
      <div className="bg-white rounded-lg border border-grey-3 p-8 flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 mt-4">
            <h1 className="text-2xl font-bold text-primary-9">
              {appLabels.demarchePcaetCreerTitre}
            </h1>
            <InfoTooltip
              label={appLabels.demarchePcaetCreerCadreReglementaire}
              activatedBy="hover"
            />
          </div>
          <p className="text-sm text-grey-7 mt-2">
            {appLabels.demarchePcaetCreerDescription}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <Field
            title={appLabels.demarchePcaetCreerIntitule}
            state={errors.titre ? 'error' : 'default'}
            message={errors.titre?.message}
          >
            <Input type="text" {...register('titre')} />
          </Field>

          <Field title={appLabels.demarchePcaetCreerObligation}>
            <Controller
              control={control}
              name="obligation"
              render={({ field }) => (
                <Select
                  options={[
                    {
                      label: appLabels.demarchePcaetCreerObligationReglementaire,
                      value: 'obligatoire',
                    },
                    {
                      label: appLabels.demarchePcaetCreerObligationVolontaire,
                      value: 'volontaire',
                    },
                  ]}
                  values={field.value}
                  onChange={(value) => {
                    if (value) field.onChange(value);
                  }}
                />
              )}
            />
          </Field>

          <Field
            title={appLabels.demarchePcaetCreerPilotes}
            hint="Ces personnes recevront les notifications mails liées à la démarche"
            state={errors.pilotes ? 'error' : 'default'}
            message={errors.pilotes?.message}
          >
            <Controller
              control={control}
              name="pilotes"
              render={({ field }) => (
                <PersonneTagDropdown
                  dataTest="demarche-create-pilotes"
                  collectiviteIds={[collectiviteId]}
                  values={field.value.map((p) => getPersonneStringId(p))}
                  placeholder={appLabels.demarchePcaetCreerRechercherPilote}
                  onChange={({ personnes }) =>
                    field.onChange(
                      personnes.map((p) => ({ ...p, nom: p.nom ?? '' }))
                    )
                  }
                />
              )}
            />
          </Field>

          <Field title={appLabels.demarchePcaetCreerDescriptionRapide}>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <Textarea
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  rows={5}
                />
              )}
            />
          </Field>

          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              variant="primary"
              icon="arrow-right-line"
              iconPosition="right"
              disabled={isSubmitting}
            >
              {appLabels.demarchePcaetCreerSoumettre}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
