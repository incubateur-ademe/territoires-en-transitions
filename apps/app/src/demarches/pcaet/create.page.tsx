'use client';

import { makeCollectiviteDemarchePcaetRootUrl } from '@/app/app/paths';
import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { emptyDemarchePcaetCompletion } from '@/app/demarches/completion';
import { DemarcheAvanceSidePanelButton } from '@/app/demarches/components/avance.side-panel-button';
import { DemarcheDetailLayout } from '@/app/demarches/components/detail.layout';
import { DemarchePilotesInfoTooltip } from '@/app/demarches/components/pilotes-info.tooltip';
import { useDemarcheAvanceSidePanel } from '@/app/demarches/components/use-avance-side-panel';
import { appLabels } from '@/app/labels/catalog';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import {
  buildDemarchePcaetTitre,
  DemarcheTypeEnum,
} from '@tet/domain/demarches';
import { Button, Checkbox, Field, Input } from '@tet/ui';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

/** Ces écrans sont propres au PCAET : le type est connu. */
const PCAET_TYPE = {
  type: appLabels.demarcheTypeLabels[DemarcheTypeEnum.PCAET],
};

const createDemarchePcaetSchema = z.object({
  pilotes: z
    .array(z.custom<PersonneTagOrUser>())
    .min(1, appLabels.demarcheCreerPilotesRequis),
  dateLancement: z.string().min(1, appLabels.demarcheCreerDateLancementRequise),
  /**
   * Le PCAET a déjà été transmis pour avis hors de la plateforme : la démarche
   * démarrera à l'étape de finalisation. Figé ici — aucun écran ne le reprend.
   */
  transmisHorsPlateforme: z.boolean(),
  /**
   * Le PCAET est porté par un SCoT-AEC. Posé aux seules collectivités ayant la
   * compétence Banatic SCOT, et pré-rempli sur oui.
   */
  isScotAec: z.boolean(),
});

type CreateDemarchePcaetForm = z.infer<typeof createDemarchePcaetSchema>;

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

  // Ce que la collectivité a le droit de déclarer : la question SCoT-AEC n'a de
  // sens que pour celles qui portent un SCoT.
  const { data: depotContext, isPending: contexteEnAttente } = useQuery(
    trpc.demarches.pcaet.getDepotContext.queryOptions({ collectiviteId })
  );
  const peutDeclarerScotAec = depotContext?.peutDeclarerScotAec ?? false;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateDemarchePcaetForm>({
    resolver: zodResolver(createDemarchePcaetSchema),
    mode: 'onChange',
    defaultValues: {
      pilotes: [
        {
          nom: `${user.prenom} ${user.nom}`.trim(),
          userId: user.id,
          tagId: null,
          collectiviteId,
        },
      ],
      dateLancement: '',
      transmisHorsPlateforme: false,
      isScotAec: true,
    },
  });

  // Le panneau d'avancement montre le parcours qui attend la collectivité :
  // cocher la case doit s'y voir tout de suite, avant même de créer.
  const transmisHorsPlateforme = useWatch({
    control,
    name: 'transmisHorsPlateforme',
  });

  const { isOpen, toggle } = useDemarcheAvanceSidePanel(
    {
      demarcheType: DemarcheTypeEnum.PCAET,
      collectiviteId,
      statut: 'en_elaboration',
      completion: emptyDemarchePcaetCompletion(),
      isPreview: true,
      horsPlateforme: transmisHorsPlateforme,
    },
    { defaultOpen: true }
  );

  const onSubmit = async (data: CreateDemarchePcaetForm) => {
    const demarche = await createDemarche({
      collectiviteId,
      // L'intitulé n'est pas saisi ici : il se déduit de l'année du lancement,
      // et reste modifiable depuis l'en-tête du dossier.
      titre: buildDemarchePcaetTitre(data.dateLancement),
      pilotes: data.pilotes.map((pilote) => ({
        tagId: pilote.tagId ?? null,
        userId: pilote.userId ?? null,
      })),
      launchedAt: data.dateLancement
        ? new Date(data.dateLancement).toISOString()
        : null,
      transmittedOffPlatform: data.transmisHorsPlateforme,
      // Une collectivité à qui la question n'est pas posée ne déclare rien, quoi
      // que porte le formulaire.
      isScotAec: peutDeclarerScotAec ? data.isScotAec : false,
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
                        placeholder={appLabels.demarcheCreerRechercherPilote}
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
                title={appLabels.demarcheCreerDateLancement}
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

              <Controller
                control={control}
                name="transmisHorsPlateforme"
                render={({ field }) => (
                  <Checkbox
                    variant="switch"
                    label={appLabels.demarcheCreerHorsPlateforme}
                    message={appLabels.demarcheCreerHorsPlateformeDescription}
                    containerClassname="flex-row-reverse justify-end gap-3"
                    data-test="demarches.creer.hors-plateforme"
                    checked={field.value}
                    onChange={() => field.onChange(!field.value)}
                  />
                )}
              />

              {peutDeclarerScotAec && (
                <Controller
                  control={control}
                  name="isScotAec"
                  render={({ field }) => (
                    <Checkbox
                      variant="switch"
                      label={appLabels.demarcheCreerScotAec}
                      message={appLabels.demarcheCreerScotAecDescription}
                      containerClassname="flex-row-reverse justify-end gap-3"
                      data-test="demarches.creer.scot-aec"
                      checked={field.value}
                      onChange={() => field.onChange(!field.value)}
                    />
                  )}
                />
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  icon="arrow-right-line"
                  iconPosition="right"
                  // Tant que le contexte n'a pas répondu, la question SCoT-AEC
                  // n'est pas affichée et sa réponse partirait à « non » — le
                  // contraire de ce qu'annonce la coche pré-remplie.
                  disabled={isSubmitting || contexteEnAttente}
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
