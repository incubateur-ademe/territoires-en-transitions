import {
  IndicateurTrajectoireId,
  METHODO_PAR_SECTEUR_SNBC3,
} from '@/app/indicateurs/trajectoires/trajectoire-constants';
import { appLabels } from '@/app/labels/catalog';
import {
  isTrajectoireSecteur,
  TrajectoirePropertiesType,
} from '@tet/domain/indicateurs';
import { Accordion, Button } from '@tet/ui';
import { MethodologieSection } from '../MethodologieSection';
import { useTelechargementMethodologieSnbc3 } from './data/use-telechargement-methodologie-snbc3';
import {
  formatEvolution,
  getEvolutionTrajectoire,
} from './evolution-trajectoire.utils';

/**
 * Encadré « Méthodologie SNBC 3 » d'un secteur sélectionné. La section
 * « SNBC 3 » se termine par l'évolution du secteur sur le territoire,
 * calculée sur les valeurs affichées : les textes restent sans chiffre, pour
 * ne pas dépendre de la release importée.
 */
export const MethodologieSnbc3 = ({
  secteur,
  indicateurId,
  valeursSecteur,
}: {
  secteur: TrajectoirePropertiesType['secteurs'][number];
  /** indicateur tracé sur le graphe : émissions ou consommations */
  indicateurId: IndicateurTrajectoireId;
  /** valeurs SNBC 3 du secteur, telles que tracées sur le graphe */
  valeursSecteur: Parameters<typeof getEvolutionTrajectoire>[0];
}) => {
  const { mutate: downloadMethodologie, isPending: isDownloading } =
    useTelechargementMethodologieSnbc3();
  const methodo = isTrajectoireSecteur(secteur.nom)
    ? METHODO_PAR_SECTEUR_SNBC3[secteur.nom]
    : undefined;
  const evolution = getEvolutionTrajectoire(valeursSecteur);
  const format = (valeur: number | null) =>
    valeur === null ? null : formatEvolution(valeur);
  const evolutionTexte = evolution
    ? appLabels.trajectoireSnbc3EvolutionSecteur({
        indicateurId,
        evolution2030: format(evolution.evolution2030),
        evolution2050: format(evolution.evolution2050),
      })
    : null;

  return (
    <Accordion
      title={appLabels.trajectoireSnbc3MethodologieTitre}
      initialState={false}
      containerClassname="border-b-0"
      content={
        <div className="flex flex-col gap-2">
          {methodo && (
            <>
              <MethodologieSection
                title={appLabels.trajectoireSnbc3MethodologieScenario}
                content={
                  evolutionTexte
                    ? [...methodo.snbc3, evolutionTexte]
                    : methodo.snbc3
                }
              />
              <MethodologieSection
                title={appLabels.trajectoireMethodologieTerritorialisation}
                content={methodo.pivots}
              />
              {methodo.precisions && (
                <MethodologieSection
                  title={appLabels.trajectoireSnbc3MethodologiePrecisions}
                  content={methodo.precisions}
                />
              )}
            </>
          )}
          <p className="mb-0 font-normal">
            {appLabels.trajectoireSnbc3MethodologieObjectifsNationaux}
          </p>
          <Button
            size="sm"
            variant="underlined"
            onClick={() => downloadMethodologie()}
            disabled={isDownloading}
          >
            {appLabels.trajectoireSnbc3ConsulterMethodologie}
          </Button>
        </div>
      }
    />
  );
};
