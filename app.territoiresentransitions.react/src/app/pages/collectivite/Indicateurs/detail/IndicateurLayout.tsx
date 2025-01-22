import { referentielToName } from '@/app/app/labels';
import BadgeIndicateurPerso from '@/app/app/pages/collectivite/Indicateurs/components/BadgeIndicateurPerso';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import { BadgeACompleter } from '@/app/ui/shared/Badge/BadgeACompleter';
import { Badge, Tab, Tabs } from '@/ui';
import { HeaderIndicateur } from '../Indicateur/detail/HeaderIndicateur';
import { useUpdateIndicateurDefinition } from '../Indicateur/useUpdateIndicateurDefinition';
import BadgeOpenData from '../components/BadgeOpenData';
import { TIndicateurDefinition } from '../types';
import ActionsLiees from './ActionsLiees';
import DonneesIndicateur from './DonneesIndicateur';
import FichesLiees from './FichesLiees';
import IndicateurToolbar from './IndicateurToolbar';
import SousIndicateurs from './SousIndicateurs';

type IndicateurLayoutProps = {
  dataTest?: string;
  definition: TIndicateurDefinition;
  isPerso?: boolean;
};

const IndicateurLayout = ({
  dataTest,
  definition,
  isPerso = false,
}: IndicateurLayoutProps) => {
  const { enfants, sansValeur, rempli, titre } = definition;

  const { mutate: updateDefinition } = useUpdateIndicateurDefinition();

  const collectivite = useCurrentCollectivite();

  const collectiviteId = collectivite?.collectiviteId;
  const isReadonly = !collectivite || collectivite?.isReadOnly;

  const composeSansAgregation = !!enfants && enfants.length > 0 && sansValeur;
  const composeAvecAgregation = !!enfants && enfants.length > 0 && !sansValeur;

  // Mise à jour des champs de l'indicateur
  const handleUpdate = (
    name: 'description' | 'commentaire' | 'unite' | 'titre',
    value: string
  ) => {
    const trimmedValue = value.trim();
    if (collectiviteId && trimmedValue !== definition[name]) {
      updateDefinition({ ...definition, [name]: trimmedValue });
    }
  };

  const handleTitreUpdate = (value: string) => handleUpdate('titre', value);

  const handleCommentaireUpdate = (value: string) =>
    handleUpdate('commentaire', value);

  const handleUniteUpdate = (value: string) => handleUpdate('unite', value);

  /**
   * TEMPORARY: currently, description input feeds two columns:
   * `description` column in `indicateur_definition`
   * `commentaire` column in `indicateur_collectivite` (via the hardcoded ['commentaire'] prop).
   *
   * TO DO: remove this function and change
   * handleUpdate('description', e.target.value) to handleUpdate('commentaire', e.target.value).
   *
   * Related to this PR: https://github.com/incubateur-ademe/territoires-en-transitions/pull/3313.
   */
  const handleDescriptionUpdate = (value: string) => {
    const trimmedValue = value.trim();
    updateDefinition({
      ...definition,
      description: trimmedValue,
      commentaire: trimmedValue,
    });
  };

  return (
    <div data-test={dataTest} className="w-full min-h-full !mt-0">
      <HeaderIndicateur
        title={titre}
        isReadonly={isReadonly || !isPerso}
        onUpdate={handleTitreUpdate}
      />

      <div className="flex flex-col px-10 py-6">
        <div className="flex items-center justify-between">
          {/* Liste des badges */}
          {!composeSansAgregation && (
            <div className="flex gap-2">
              <BadgeACompleter a_completer={!rempli} />
              {isPerso && <BadgeIndicateurPerso />}
              {definition.participationScore && (
                <Badge
                  title={`Participe au score ${referentielToName.cae}`}
                  uppercase={false}
                  state="grey"
                />
              )}
              {definition.hasOpenData && <BadgeOpenData />}
            </div>
          )}

          {/* Menu export / infos / suppression */}
          <IndicateurToolbar
            {...{ definition, isPerso, isReadonly }}
            collectiviteId={collectiviteId!}
            className="ml-auto"
          />
        </div>

        {composeSansAgregation ? (
          // Groupe d'indicateurs sans agrégation
          <SousIndicateurs definition={definition} enfantsIds={enfants} />
        ) : (
          // Indicateur sans enfant, groupe d'indicateurs avec agrégation,
          // ou indicateur personnalisé
          <Tabs
            className="mt-12"
            tabsListClassName="!justify-start flex-nowrap overflow-x-auto"
          >
            {/* Données */}
            <Tab label="Données">
              <DonneesIndicateur
                {...{ definition, isPerso, isReadonly }}
                updateUnite={handleUniteUpdate}
                updateDescription={(value) =>
                  isPerso
                    ? handleDescriptionUpdate(value)
                    : handleCommentaireUpdate(value)
                }
              />
            </Tab>

            {/* Sous indicateurs */}
            {composeAvecAgregation ? (
              <Tab label={`${enfants.length} Sous indicateurs`}>
                <SousIndicateurs definition={definition} enfantsIds={enfants} />
              </Tab>
            ) : undefined}

            {/* Actions des référentiels liées */}
            {!isPerso ? (
              <Tab label="Actions des référentiels liées">
                <ActionsLiees
                  actionsIds={(definition.actions ?? []).map((a) => a.id)}
                />
              </Tab>
            ) : undefined}

            {/* Fiches des plans liées */}
            <Tab label="Fiches des plans liées">
              <FichesLiees definition={definition} isReadonly={isReadonly} />
            </Tab>
          </Tabs>
        )}

        <ScrollTopButton className="mt-8" />
      </div>
    </div>
  );
};

export default IndicateurLayout;
