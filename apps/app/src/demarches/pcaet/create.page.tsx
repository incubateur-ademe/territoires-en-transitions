'use client';

import { makeCollectiviteDemarchePcaetRootUrl } from '@/app/app/paths';
import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { DemarchePilotesInfoTooltip } from '@/app/demarches/components/pilotes-info.tooltip';
import { DemarcheAvanceSidePanelButton } from '@/app/demarches/components/avance.side-panel-button';
import { DemarcheDetailLayout } from '@/app/demarches/components/detail.layout';
import { useDemarcheAvanceSidePanel } from '@/app/demarches/components/use-avance-side-panel';
import { emptyDemarchePcaetCompletion } from '@/app/demarches/completion';
import { DrealContextBanner } from '@/app/demarches/pcaet/vue-dreal/components/dreal-context-banner';
import { appLabels } from '@/app/labels/catalog';
import { DemarcheTypeEnum } from '@tet/domain/demarches';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import { Button, Field, Input } from '@tet/ui';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

/** Ces écrans sont propres au PCAET : le type est connu. */
const PCAET_TYPE = {
  type: appLabels.demarcheTypeLabels[DemarcheTypeEnum.PCAET],
};

const createDemarchePcaetSchema = z.object({
  titre: z.string().min(1, appLabels.demarcheCreerIntituleRequis),

  pilotes: z
    .array(z.custom<PersonneTagOrUser>())
    .min(1, appLabels.demarcheCreerPilotesRequis),
  dateLancement: z
    .string()
    .min(1, appLabels.demarcheCreerDateDebutRequise),
});

type CreateDemarchePcaetForm = z.infer<typeof createDemarchePcaetSchema>;

const TITRE_FIELD_ID = 'create-demarche-pcaet-titre';
const PILOTES_FIELD_ID = 'create-demarche-pcaet-pilotes';
const DATE_LANCEMENT_FIELD_ID = 'create-demarche-pcaet-date-lancement';

export const CreateDemarchePcaetPage = () => {
  const router = useRouter();
  const { collectiviteId } = useCurrentCollectivite();
  const user = useUser();
  const trpc = useTRPC();

  const { mutateAsync: createDemarche } = useMutation(
    trpc.demarches.pcaet.create.mutationOptions()
  );

  const { isOpen, toggle } = useDemarcheAvanceSidePanel(
    {
      demarcheType: DemarcheTypeEnum.PCAET,
    collectiviteId,
      statut: 'en_elaboration',
      completion: emptyDemarchePcaetCompletion(),
      isPreview: true,
    },
    { defaultOpen: true }
  );

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
    },
  });

  const onSubmit = async (data: CreateDemarchePcaetForm) => {
    const demarche = await createDemarche({
      collectiviteId,
      titre: data.titre,
      pilotes: data.pilotes.map((pilote) => ({
        tagId: pilote.tagId ?? null,
        userId: pilote.userId ?? null,
      })),
      launchedAt: data.dateLancement
        ? new Date(data.dateLancement).toISOString()
        : null,
    });
    router.push(
      makeCollectiviteDemarchePcaetRootUrl({
        collectiviteId,
        demarcheId: demarche.id,
      })
    );
  };

  return (
    <DemarcheDetailLayout.Root>
      <DrealContextBanner />

      <DemarcheDetailLayout.Container>
        <DemarcheDetailLayout.Main>
          <div className="bg-white rounded-lg border border-grey-3 p-8 flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-primary-9">
                  {appLabels.demarcheCreerTitre(PCAET_TYPE)}
                </h1>

                <p className="text-sm text-grey-7 mt-2">
                  {appLabels.demarcheCreerCadreReglementaire}
                </p>
              </div>
              <DemarcheAvanceSidePanelButton isOpen={isOpen} onClick={toggle} />
            </div>
            <p className="text-sm text-grey-7 mt-2">
              {appLabels.demarcheCreerChampsObligatoiresLegende}
            </p>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              <Field
                title={appLabels.demarcheCreerIntitule}
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
                <div
                  id={`${PILOTES_FIELD_ID}-label`}
                  className="flex items-center gap-2 text-primary-9"
                >
                  {appLabels.demarcheCreerPilotes}
                  <DemarchePilotesInfoTooltip />
                </div>
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
                          appLabels.demarcheCreerRechercherPilote
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
                title={appLabels.demarcheCreerDateDebut}
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

              <div className="flex justify-end gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  icon="arrow-right-line"
                  iconPosition="right"
                  disabled={isSubmitting}
                >
                  {appLabels.demarcheCreerSoumettre}
                </Button>
              </div>
            </form>
          </div>
        </DemarcheDetailLayout.Main>
      </DemarcheDetailLayout.Container>
    </DemarcheDetailLayout.Root>
  );
};
