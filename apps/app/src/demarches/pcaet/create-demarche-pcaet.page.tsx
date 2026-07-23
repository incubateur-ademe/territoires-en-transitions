'use client';

import { makeCollectiviteDemarchePcaetRootUrl } from '@/app/app/paths';
import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { DemarchePcaetPilotesInfoTooltip } from '@/app/demarches/pcaet/components/demarche-pcaet-pilotes-info-tooltip';
import { PcaetAvanceSidePanelButton } from '@/app/demarches/pcaet/components/pcaet-avance.side-panel-button';
import { PcaetDetailLayout } from '@/app/demarches/pcaet/components/pcaet-detail-layout';
import { usePcaetAvanceSidePanel } from '@/app/demarches/pcaet/components/use-pcaet-avance-side-panel';
import { emptyDemarchePcaetCompletion } from '@/app/demarches/pcaet/demarche-pcaet-completion';
import { createDemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import { DrealContextBanner } from '@/app/demarches/pcaet/vue-dreal/components/dreal-context-banner';
import { appLabels } from '@/app/labels/catalog';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import { Button, Field, Input, Textarea } from '@tet/ui';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const createDemarchePcaetSchema = z.object({
  titre: z.string().min(1, appLabels.demarchePcaetCreerIntituleRequis),

  pilotes: z
    .array(z.custom<PersonneTagOrUser>())
    .min(1, appLabels.demarchePcaetCreerPilotesRequis),
  dateLancement: z
    .string()
    .min(1, appLabels.demarchePcaetCreerDateDebutRequise),
  description: z.string(),
});

type CreateDemarchePcaetForm = z.infer<typeof createDemarchePcaetSchema>;

const TITRE_FIELD_ID = 'create-demarche-pcaet-titre';
const PILOTES_FIELD_ID = 'create-demarche-pcaet-pilotes';
const DATE_LANCEMENT_FIELD_ID = 'create-demarche-pcaet-date-lancement';

export const CreateDemarchePcaetPage = () => {
  const router = useRouter();
  const { collectiviteId } = useCurrentCollectivite();
  const user = useUser();

  const { isOpen, toggle } = usePcaetAvanceSidePanel({
    collectiviteId,
    statut: 'en_elaboration',
    completion: emptyDemarchePcaetCompletion(),
    isPreview: true,
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateDemarchePcaetForm>({
    resolver: zodResolver(createDemarchePcaetSchema),
    mode: 'onChange',
    defaultValues: {
      titre: `PCAET réglementaire ${new Date().getFullYear()}`,
      pilotes: [
        {
          nom: `${user.prenom} ${user.nom}`.trim(),
          userId: user.id,
          tagId: null,
          collectiviteId,
        },
      ],
      dateLancement: '',
      description: '',
    },
  });

  const onSubmit = (data: CreateDemarchePcaetForm) => {
    const demarche = createDemarchePcaet({
      collectiviteId,
      titre: data.titre,
      description: data.description,
      pilotes: data.pilotes,
      dateLancement: data.dateLancement
        ? new Date(data.dateLancement).toISOString()
        : null,
    });
    router.push(
      makeCollectiviteDemarchePcaetRootUrl({
        collectiviteId,
        demarchePcaetId: demarche.id,
      })
    );
  };

  return (
    <PcaetDetailLayout.Root>
      <DrealContextBanner />

      <PcaetDetailLayout.Container>
        <PcaetDetailLayout.Main>
          <div className="bg-white rounded-lg border border-grey-3 p-8 flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-primary-9">
                  {appLabels.demarchePcaetCreerTitre}
                </h1>

                <p className="text-sm text-grey-7 mt-2">
                  {appLabels.demarchePcaetCreerCadreReglementaire}
                </p>
              </div>
              <PcaetAvanceSidePanelButton isOpen={isOpen} onClick={toggle} />
            </div>
            <p className="text-sm text-grey-7 mt-2">
              {appLabels.demarchePcaetCreerChampsObligatoiresLegende}
            </p>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              <Field
                title={appLabels.demarchePcaetCreerIntitule}
                htmlFor={TITRE_FIELD_ID}
                state={errors.titre ? 'error' : 'default'}
                message={errors.titre?.message}
              >
                <Input
                  id={TITRE_FIELD_ID}
                  type="text"
                  aria-required="true"
                  {...register('titre')}
                />
              </Field>

              <div className="flex flex-col gap-2">
                <label
                  id={`${PILOTES_FIELD_ID}-label`}
                  className="flex items-center gap-2 text-primary-9"
                >
                  {appLabels.demarchePcaetCreerPilotes}
                  <DemarchePcaetPilotesInfoTooltip />
                </label>
                <Field
                  state={errors.pilotes ? 'error' : 'default'}
                  message={errors.pilotes?.message}
                >
                  <Controller
                    control={control}
                    name="pilotes"
                    render={({ field }) => (
                      <PersonneTagDropdown
                        aria-labelledby={`${PILOTES_FIELD_ID}-label`}
                        aria-required="true"
                        collectiviteIds={[collectiviteId]}
                        values={field.value.map((p) => getPersonneStringId(p))}
                        placeholder={
                          appLabels.demarchePcaetCreerRechercherPilote
                        }
                        onChange={({ personnes }) =>
                          field.onChange(
                            personnes.map((p) => ({ ...p, nom: p.nom ?? '' }))
                          )
                        }
                      />
                    )}
                  />
                </Field>
              </div>

              <Field
                title={appLabels.demarchePcaetCreerDateDebut}
                htmlFor={DATE_LANCEMENT_FIELD_ID}
                state={errors.dateLancement ? 'error' : 'default'}
                message={errors.dateLancement?.message}
              >
                <Input
                  id={DATE_LANCEMENT_FIELD_ID}
                  type="date"
                  min="1900-01-01"
                  max="2100-01-01"
                  aria-required="true"
                  {...register('dateLancement')}
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
        </PcaetDetailLayout.Main>
      </PcaetDetailLayout.Container>
    </PcaetDetailLayout.Root>
  );
};
