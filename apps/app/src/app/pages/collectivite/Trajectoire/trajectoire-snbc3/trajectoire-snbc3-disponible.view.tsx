import { SgpeMondrian } from '@/app/indicateurs/trajectoire-leviers/sgpe-mondrian';
import {
  HELPDESK_URL,
  INDICATEURS_TRAJECTOIRE_IDS,
  INDICATEURS_TRAJECTOIRE_SNBC3,
  IndicateurTrajectoireId,
} from '@/app/indicateurs/trajectoires/trajectoire-constants';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Z_INDEX_ABOVE_STICKY_HEADER } from '@tet/design-tokens';
import {
  Alert,
  Button,
  ButtonGroup,
  Card,
  Event,
  Modal,
  PageHeader,
  Select,
  Spacer,
  useEventTracker,
  VisibleWhen,
} from '@tet/ui';
import { isNil } from 'es-toolkit';
import { parseAsInteger, parseAsStringEnum, useQueryStates } from 'nuqs';
import { useState } from 'react';
import { ComparezLaTrajectoire } from '../ComparezLaTrajectoire';
import { GrapheSecteur } from '../graphes/GrapheSecteur';
import { GrapheTousSecteurs } from '../graphes/GrapheTousSecteurs';
import { LinksToIndicateurs } from '../links-to-indicateurs';
import { AllerPlusLoinSnbc3 } from './aller-plus-loin-snbc3';
import { useIndicateurTrajectoireSnbc3 } from './data/use-indicateur-trajectoire-snbc3';
import { MethodologieSnbc3 } from './methodologie-snbc3';
import { Snbc3ChangementsModal } from './snbc3-changements.modal';
import { Snbc3TransitionBanner } from './snbc3-transition.banner';

const DISPLAYABLE_INDICATEURS_TRAJECTOIRE: IndicateurTrajectoireId[] = [
  'emissions_ges',
  'consommations_finales',
];

/**
 * Trajectoire SNBC 3 importée : graphes, comparaison avec les objectifs et
 * résultats de la collectivité, et mondrian. Reprend `TrajectoireCalculee`,
 * sans « Recalculer » ni saisie de données.
 */
export const TrajectoireSnbc3DisponibleView = ({
  millesime,
}: {
  millesime: { dateVersion: string } | null;
}) => {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const trackEvent = useEventTracker();
  const [isChangementsOpen, setIsChangementsOpen] = useState(false);

  // mêmes clés d'URL que l'ancienne page : les liens existants restent valables
  const [params, setParams] = useQueryStates(
    {
      indicateurId: parseAsStringEnum<IndicateurTrajectoireId>([
        ...INDICATEURS_TRAJECTOIRE_IDS,
      ]).withDefault('emissions_ges'),
      secteurIdx: parseAsInteger.withDefault(0),
    },
    { urlKeys: { indicateurId: 'i', secteurIdx: 's' } }
  );
  const { indicateurId, secteurIdx: selectedSecteurIdx } = params;

  const indicateur = INDICATEURS_TRAJECTOIRE_SNBC3[indicateurId];
  const secteurs = [
    { nom: appLabels.trajectoireTousLesSecteurs, identifiant: undefined },
    ...(indicateur.secteurs || []),
  ];
  const selectedSecteur =
    selectedSecteurIdx === 0
      ? null
      : indicateur.secteurs[selectedSecteurIdx - 1] ?? null;

  const {
    identifiant,
    objectifs,
    resultats,
    valeursTousSecteurs,
    valeursSecteur,
    valeursSousSecteurs,
    isLoadingObjectifsResultats,
    isLoadingTrajectoire,
    isErrorTrajectoire,
    emissionsNettes,
  } = useIndicateurTrajectoireSnbc3({
    indicateur,
    secteurIdx: selectedSecteurIdx,
  });

  const isLoadingTrajectoireIndicateurData =
    !isErrorTrajectoire &&
    (isLoadingTrajectoire || isLoadingObjectifsResultats);
  const allSecteursDataAvailable = !selectedSecteur && valeursTousSecteurs;
  const selectedSecteurDataAvailable =
    selectedSecteur && valeursSecteur && valeursSecteur.source.length;
  const selectedSecteurDataNotAvailable = Boolean(
    selectedSecteur &&
      !isLoadingTrajectoire &&
      !isErrorTrajectoire &&
      !valeursSecteur
  );

  const canMutateValeurs = hasCollectivitePermission(
    'indicateurs.valeurs.mutate'
  );
  const comparezLaTrajectoireIsVisible =
    !isLoadingObjectifsResultats &&
    (objectifs.source.length === 0 || resultats.source.length === 0);

  if (!collectiviteId) {
    return null;
  }

  const openChangementsFromTitre = () => {
    trackEvent(Event.trajectoire.snbc3.openChangements, {
      origine: 'lien_titre',
    });
    setIsChangementsOpen(true);
  };

  return (
    <div className="grow" data-test="indicateurs.trajectoires.snbc3.page">
      <PageHeader sticky>
        <PageHeader.Title>
          {appLabels.trajectoireSnbc3EtObjectifs}
        </PageHeader.Title>

        <PageHeader.Subtitle>
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              size="sm"
              variant="underlined"
              onClick={openChangementsFromTitre}
              dataTest="indicateurs.trajectoires.snbc3.lien-changements"
            >
              {appLabels.trajectoireSnbc3CeQuiChange}
            </Button>
            <div className="w-[0.5px] h-8 bg-primary-7" />
            <Modal
              size="md"
              title={appLabels.trajectoireAllerPlusLoin}
              render={() => <AllerPlusLoinSnbc3 />}
            >
              <Button size="sm" variant="underlined">
                {appLabels.trajectoireAllerPlusLoin}
              </Button>
            </Modal>
            <div className="w-[0.5px] h-8 bg-primary-7" />
            <Button size="sm" variant="underlined" external href={HELPDESK_URL}>
              {appLabels.trajectoireEnSavoirPlus}
            </Button>
            {millesime && (
              <span className="text-sm text-grey-7">
                {appLabels.trajectoireSnbc3Millesime({
                  date: getTextFormattedDate({ date: millesime.dateVersion }),
                })}
              </span>
            )}
          </div>
        </PageHeader.Subtitle>

        <PageHeader.Metadata>
          <div className="flex items-center gap-4">
            <ButtonGroup
              size="sm"
              activeButtonId={indicateur.id}
              buttons={DISPLAYABLE_INDICATEURS_TRAJECTOIRE.map(
                (nextIndicateurId) => {
                  const { nom, secteurs: nextSecteurs } =
                    INDICATEURS_TRAJECTOIRE_SNBC3[nextIndicateurId];
                  return {
                    id: nextIndicateurId,
                    children: nom,
                    onClick: () => {
                      trackEvent(Event.trajectoire.selectIndicateur, {
                        indicateurId: nextIndicateurId,
                      });
                      // garde le secteur sélectionné s'il existe aussi dans
                      // l'autre indicateur
                      const nextSecteurIdx = selectedSecteur
                        ? nextSecteurs.findIndex(
                            (s) => s.nom === selectedSecteur.nom
                          )
                        : -1;
                      return setParams({
                        indicateurId: nextIndicateurId,
                        secteurIdx:
                          nextSecteurIdx >= 0 ? nextSecteurIdx + 1 : 0,
                      });
                    },
                  };
                }
              )}
            />

            <div className="w-64">
              <Select
                values={selectedSecteurIdx}
                dropdownZindex={Z_INDEX_ABOVE_STICKY_HEADER}
                placeholder={appLabels.trajectoireTousLesSecteurs}
                options={secteurs.map(({ nom }, optionIdx) => ({
                  value: optionIdx,
                  label: nom,
                }))}
                onChange={(val) => {
                  const secteurIdx = !isNil(val)
                    ? typeof val === 'number'
                      ? val
                      : parseInt(String(val))
                    : 0;
                  if (secteurIdx > 0) {
                    trackEvent(Event.trajectoire.selectSecteur, {
                      indicateurId: indicateur.id,
                      secteur: indicateur.secteurs[secteurIdx - 1]?.identifiant,
                    });
                  }
                  return setParams({ secteurIdx });
                }}
              />
            </div>
          </div>
        </PageHeader.Metadata>
      </PageHeader>

      <div className="flex flex-col gap-8 w-full">
        <Snbc3TransitionBanner
          onOpenChangements={() => setIsChangementsOpen(true)}
        />

        <VisibleWhen condition={isErrorTrajectoire}>
          <div data-test="indicateurs.trajectoires.snbc3.erreur-chargement-trajectoire">
            <Alert
              state="error"
              title={appLabels.trajectoireErreurChargementDonnees}
              description={
                appLabels.trajectoireErreurChargementDonneesDescription
              }
            />
          </div>
        </VisibleWhen>

        <VisibleWhen condition={selectedSecteurDataNotAvailable}>
          <div data-test="indicateurs.trajectoires.snbc3.secteur-non-disponible">
            <Alert
              state="info"
              title={appLabels.donneesNonDisponibles}
              description={appLabels.trajectoireSnbc3SecteurNonDisponible}
            />
          </div>
        </VisibleWhen>

        <VisibleWhen condition={comparezLaTrajectoireIsVisible}>
          <ComparezLaTrajectoire
            collectiviteId={collectiviteId}
            identifiantReferentiel={identifiant}
            readonly={!canMutateValeurs}
          />
        </VisibleWhen>

        {allSecteursDataAvailable && (
          <Card className="h-fit">
            <GrapheTousSecteurs
              unite={indicateur.unite}
              titre={indicateur.titre}
              secteurs={valeursTousSecteurs}
              objectifs={objectifs}
              resultats={resultats}
              emissionsNettes={emissionsNettes}
            />
          </Card>
        )}

        {selectedSecteurDataAvailable && (
          <Card className="h-fit">
            <GrapheSecteur
              unite={indicateur.unite}
              titre={`${indicateur.titre}, secteur ${selectedSecteur.nom}`}
              secteur={valeursSecteur}
              sousSecteurs={valeursSousSecteurs || null}
              objectifs={objectifs}
              resultats={resultats}
            />
            <Spacer height={0.5} />
            <LinksToIndicateurs
              indicateurData={[valeursSecteur, ...(valeursSousSecteurs || [])]}
              collectiviteId={collectiviteId}
              indicateurView="cae"
            />
            <MethodologieSnbc3
              secteur={selectedSecteur}
              indicateurId={indicateurId}
              valeursSecteur={valeursSecteur.source}
            />
          </Card>
        )}

        <VisibleWhen condition={isLoadingTrajectoireIndicateurData}>
          <Card className="h-[450px]">
            <div className="flex flex-col h-full">
              <h3 className="text-base mb-0">{indicateur.titre}</h3>
              <SpinnerLoader className="m-auto" />
            </div>
          </Card>
        </VisibleWhen>

        <VisibleWhen condition={indicateurId === 'emissions_ges'}>
          <SgpeMondrian
            selectedSecteurIdentifiant={selectedSecteur?.identifiant}
            onSelected={(secteurIdentifiants) => {
              const secteursIdx = secteurIdentifiants?.map(
                (secteurIdentifiant) =>
                  secteurs.findIndex(
                    (secteur) => secteurIdentifiant === secteur?.identifiant
                  )
              );
              const firstValidSecteurIdx =
                secteursIdx?.find((idx) => idx !== -1) || 0;
              setParams({ secteurIdx: firstValidSecteurIdx });
            }}
          />
        </VisibleWhen>
      </div>

      <Snbc3ChangementsModal
        isOpen={isChangementsOpen}
        setIsOpen={setIsChangementsOpen}
      />
    </div>
  );
};
