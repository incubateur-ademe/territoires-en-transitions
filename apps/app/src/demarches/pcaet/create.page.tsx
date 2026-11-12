'use client';

import { makeCollectiviteDemarchePcaetRootUrl } from '@/app/app/paths';
import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { emptyDemarchePcaetCompletion } from '@/app/demarches/completion';
import { DemarcheAvanceSidePanelButton } from '@/app/demarches/components/avance.side-panel-button';
import { DemarcheDetailLayout } from '@/app/demarches/components/detail.layout';
import { CollectivitesCouvertesField } from '@/app/demarches/pcaet/collectivites-couvertes-field';
import { DemarchePilotesInfoTooltip } from '@/app/demarches/components/pilotes-info.tooltip';
import { useDemarcheAvanceSidePanel } from '@/app/demarches/components/use-avance-side-panel';
import { appLabels } from '@/app/labels/catalog';
import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import {
  buildDemarchePcaetTitre,
  DemarcheTypeEnum,
} from '@tet/domain/demarches';
import { Alert, Button, Checkbox, Field, Input } from '@tet/ui';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
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
  /**
   * EPCI couverts, posés aux seuls Supra. Requis dès qu'un membre est proposé,
   * ce que seul le contexte de dépôt dit : vérifié à l'envoi.
   */
  collectivitesCouvertesIds: z.array(z.number()),
});

type CreateDemarchePcaetForm = z.infer<typeof createDemarchePcaetSchema>;

const PILOTES_FIELD_ID = 'create-demarche-pcaet-pilotes';
const DATE_LANCEMENT_FIELD_ID = 'create-demarche-pcaet-date-lancement';

export const CreateDemarchePcaetPage = () => {
  const router = useRouter();
  const { collectiviteId } = useCurrentCollectivite();
  const user = useUser();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutateAsync: createDemarche } = useMutation(
    trpc.demarches.pcaet.create.mutationOptions({
      // Les EPCI cochés ne le sont plus ailleurs.
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.demarches.pcaet.getDepotContext.pathKey(),
        }),
    })
  );

  // Ce que la collectivité a le droit de déclarer : la question SCoT-AEC n'a de
  // sens que pour celles qui portent un SCoT.
  // Toujours relu : qui est déjà engagé change avec les dépôts des autres.
  const { data: depotContext, isPending: contexteEnAttente } = useQuery(
    trpc.demarches.pcaet.getDepotContext.queryOptions(
      { collectiviteId },
      { staleTime: 0 }
    )
  );
  const peutDeclarerScotAec = depotContext?.peutDeclarerScotAec ?? false;
  // Même garde que le serveur : flag inactif, le Supra dépose sans périmètre.
  const isPcaetSupraEnabled = useIsFeatureFlagEnabled('is-pcaet-supra-enabled');
  const estSupra = isPcaetSupraEnabled && (depotContext?.estSupra ?? false);
  const epciCandidats = useMemo(
    () => depotContext?.epciCandidats ?? [],
    [depotContext]
  );
  // Un Supra sans membre connu dépose comme les autres ; s'il en a, son dépôt
  // en couvre au moins un, encore libre.
  const perimetreRequis = estSupra && epciCandidats.length > 0;
  const tousEngages =
    perimetreRequis && epciCandidats.every(({ engagement }) => engagement);
  // Un EPCI couvert par le dépôt en cours d'un Supra ne commence pas le sien,
  // flag actif ou non : le serveur refuserait.
  const couvertureEnCours = depotContext?.couvertureEnCours ?? null;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
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
      collectivitesCouvertesIds: [],
    },
  });

  // Tout est décoché, sauf en renouvellement : le périmètre du dépôt précédent
  // est repris, limité aux membres encore proposés et disponibles.
  useEffect(() => {
    const candidatIds = new Set(
      epciCandidats.filter(({ engagement }) => !engagement).map(({ id }) => id)
    );
    setValue(
      'collectivitesCouvertesIds',
      (depotContext?.perimetrePrecedent ?? []).filter((id) =>
        candidatIds.has(id)
      )
    );
  }, [depotContext, epciCandidats, setValue]);

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
    if (perimetreRequis && data.collectivitesCouvertesIds.length === 0) {
      setError('collectivitesCouvertesIds', {
        message: appLabels.demarcheCreerCollectivitesCouvertesRequises,
      });
      return;
    }
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
      collectivitesCouvertesIds: estSupra ? data.collectivitesCouvertesIds : [],
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
            {!couvertureEnCours && !tousEngages && (
              <p className="text-sm text-grey-7 mt-2">
                {appLabels.demarcheCreerChampsObligatoiresLegende}
              </p>
            )}

            {couvertureEnCours ? (
              <Alert
                state="info"
                title={appLabels.demarcheCreationBloqueeCouverture({
                  porteur: couvertureEnCours.porteur.nom,
                  dateDebut: format(
                    parseISO(couvertureEnCours.dateDebut),
                    'dd/MM/yyyy'
                  ),
                })}
              />
            ) : tousEngages ? (
              <Alert
                state="info"
                title={appLabels.demarcheCreationBloqueeTousEngages}
              />
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-5"
              >
                {estSupra && (
                  <Controller
                    control={control}
                    name="collectivitesCouvertesIds"
                    render={({ field }) => (
                      <CollectivitesCouvertesField
                        porteurId={collectiviteId}
                        candidats={epciCandidats}
                        value={field.value}
                        onChange={field.onChange}
                        errorMessage={errors.collectivitesCouvertesIds?.message}
                      />
                    )}
                  />
                )}

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
                          values={field.value.map((p) =>
                            getPersonneStringId(p)
                          )}
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
                      containerClassname="gap-3"
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
                        containerClassname="gap-3"
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
            )}
          </div>
        </DemarcheDetailLayout.Main>
      </DemarcheDetailLayout.Container>
    </DemarcheDetailLayout.Root>
  );
};
