import { referentielToName } from '@/app/app/labels';
import BadgeIndicateurPerso from '@/app/app/pages/collectivite/Indicateurs/components/BadgeIndicateurPerso';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import { BadgeACompleter } from '@/app/ui/shared/Badge/BadgeACompleter';
import { Badge, Tab, Tabs } from '@/ui';
import ActionsLieesListe from '../../PlansActions/FicheAction/ActionsLiees/ActionsLieesListe';
import { FichesActionLiees } from '../Indicateur/FichesActionLiees';
import { HeaderIndicateur } from '../Indicateur/detail/HeaderIndicateur';
import { useUpdateIndicateurDefinition } from '../Indicateur/useUpdateIndicateurDefinition';
import BadgeOpenData from '../components/BadgeOpenData';
import { TIndicateurDefinition } from '../types';
import DonneesIndicateur from './DonneesIndicateur';
import IndicateurToolbar from './IndicateurToolbar';

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
  const { titre, rempli } = definition;

  const { mutate: updateDefinition } = useUpdateIndicateurDefinition();
  const collectivite = useCurrentCollectivite();

  const collectiviteId = collectivite?.collectivite_id;
  const isReadonly = !collectivite || collectivite?.readonly;

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
          <div className="flex gap-2">
            <BadgeACompleter a_completer={!rempli} />
            <BadgeIndicateurPerso />
            {definition.participationScore && (
              <Badge
                title={`Participe au score ${referentielToName.cae}`}
                uppercase={false}
                state="grey"
              />
            )}
            {definition.hasOpenData && <BadgeOpenData />}
          </div>

          <IndicateurToolbar
            {...{ definition, isPerso, isReadonly }}
            collectiviteId={collectiviteId!}
          />
        </div>

        {/* Indicateur sans enfant, groupe d'indicateurs avec agrégation,
        ou indicateur personnalisé */}
        <Tabs className="mt-12" tabsListClassName="!justify-start">
          {/* Données */}
          <Tab label="Données">
            <DonneesIndicateur
              {...{ definition, isPerso, isReadonly }}
              updateUnite={handleUniteUpdate}
              updateDescription={handleDescriptionUpdate}
            />
          </Tab>

          {/* Actions des référentiels liées */}
          {!isPerso ? (
            <Tab label="Actions des référentiels liées">
              <ActionsLieesListe
                actionsIds={(definition.actions ?? []).map((a) => a.id)}
              />
            </Tab>
          ) : undefined}

          {/* Fiches des plans liées */}
          <Tab label="Fiches des plans liées">
            <FichesActionLiees definition={definition} />
          </Tab>
        </Tabs>

        <ScrollTopButton className="mt-8" />
      </div>
    </div>
  );
};

export default IndicateurLayout;
