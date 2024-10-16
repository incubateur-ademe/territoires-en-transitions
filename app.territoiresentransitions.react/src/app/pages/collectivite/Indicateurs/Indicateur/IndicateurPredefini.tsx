import ScrollTopButton from 'ui/buttons/ScrollTopButton';
import { HeaderIndicateur } from './detail/HeaderIndicateur';
import { IndicateurCompose } from './detail/IndicateurCompose';
import { IndicateurSidePanelToolbar } from './IndicateurSidePanelToolbar';
import { TIndicateurDefinition } from '../types';
import { useIndicateurDefinition } from './useIndicateurDefinition';
import { Badge, Field, TrackPageView } from '@tet/ui';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useIndicateurImportSources } from 'app/pages/collectivite/Indicateurs/Indicateur/detail/useImportSources';
import { ImportSourcesSelector } from 'app/pages/collectivite/Indicateurs/Indicateur/detail/ImportSourcesSelector';
import IndicateurDetailChart from 'app/pages/collectivite/Indicateurs/Indicateur/detail/IndicateurDetailChart';
import { BadgeACompleter } from 'ui/shared/Badge/BadgeACompleter';
import TextareaControlled from 'ui/shared/form/TextareaControlled';
import { referentielToName } from 'app/labels';
import { IndicateurValuesTabs } from 'app/pages/collectivite/Indicateurs/Indicateur/detail/IndicateurValuesTabs';
import { IndicateurInfoLiees } from 'app/pages/collectivite/Indicateurs/Indicateur/detail/IndicateurInfoLiees';
import { FichesActionLiees } from 'app/pages/collectivite/Indicateurs/Indicateur/FichesActionLiees';
import ActionsLieesListe from 'app/pages/collectivite/PlansActions/FicheAction/ActionsLiees/ActionsLieesListe';
import { useCurrentCollectivite } from 'core-logic/hooks/useCurrentCollectivite';
import { useUpdateIndicateurDefinition } from './useUpdateIndicateurDefinition';
import BadgeOpenData from '@tet/app/pages/collectivite/Indicateurs/components/BadgeOpenData';

/** Charge et affiche le détail d'un indicateur prédéfini et de ses éventuels "enfants" */
export const IndicateurPredefiniBase = ({
  definition,
}: {
  definition: TIndicateurDefinition;
}) => {
  const { commentaire } = definition;
  const { mutate: updateDefinition } = useUpdateIndicateurDefinition();
  const collectivite = useCurrentCollectivite();
  const isReadonly = !collectivite || collectivite?.readonly;

  const collectivite_id = useCollectiviteId()!;

  const { sources, currentSource, setCurrentSource } =
    useIndicateurImportSources(definition.id);

  // génère les fonctions d'enregistrement des modifications
  const handleUpdate = (name: 'commentaire', value: string) => {
    const collectivite_id = collectivite?.collectivite_id;
    const nouveau = value?.trim();
    if (collectivite_id && nouveau !== definition[name]) {
      updateDefinition({ ...definition, [name]: nouveau });
    }
  };

  return (
    <>
      <TrackPageView
        pageName="app/indicateurs/predefini"
        properties={{ collectivite_id, indicateur_id: definition.identifiant! }}
      />
      <HeaderIndicateur title={definition.titre} />
      <div className="px-10 py-4">
        <div className="flex flex-row justify-end fr-mb-2w">
          <IndicateurSidePanelToolbar definition={definition} />
        </div>
        {/** affiche les indicateurs "enfants" */}
        {definition.enfants?.length ? (
          <IndicateurCompose definition={definition} />
        ) : (
          /** ou juste le détail si il n'y a pas d'enfants */
          <>
            <div className="flex items-center mb-8 gap-4">
              <BadgeACompleter a_completer={!definition.rempli} />
              {definition.participationScore && (
                <Badge
                  title={`Participe au score ${referentielToName.cae}`}
                  uppercase={false}
                  state="grey"
                />
              )}
              {definition.hasOpenData && <BadgeOpenData />}
            </div>
            {!!sources?.length && (
              <ImportSourcesSelector
                definition={definition}
                sources={sources}
                currentSource={currentSource}
                setCurrentSource={setCurrentSource}
              />
            )}
            <IndicateurDetailChart
              className="mb-10"
              definition={definition}
              rempli={definition.rempli}
              source={currentSource}
              titre={definition.titreLong || definition.titre}
              fileName={definition.titre}
            />

            <IndicateurValuesTabs
              definition={definition}
              importSource={currentSource}
            />

            <div className="flex flex-col gap-8 mt-10">
              <Field title="Description et méthodologie de calcul">
                <TextareaControlled
                  data-test="desc"
                  className="fr-input fr-mt-1w !outline-none"
                  initialValue={commentaire}
                  readOnly={isReadonly}
                  disabled={isReadonly}
                  onBlur={(e) => handleUpdate('commentaire', e.target.value)}
                />
              </Field>
            </div>

            <div className="flex flex-col gap-8 mt-10">
              <IndicateurInfoLiees definition={definition} />
              {
                /** actions liées */
                definition.actions?.length ? (
                  <Field
                    title={
                      definition.actions.length > 1
                        ? 'Actions liées'
                        : 'Action liée'
                    }
                  >
                    <ActionsLieesListe
                      actionsIds={(definition.actions ?? []).map((a) => a.id)}
                    />
                  </Field>
                ) : null
              }
              <FichesActionLiees definition={definition} />
            </div>
          </>
        )}
        <ScrollTopButton className="fr-mt-4w" />
      </div>
    </>
  );
};

export const IndicateurPredefini = ({
  indicateurId,
}: {
  indicateurId: number | string;
}) => {
  const definition = useIndicateurDefinition(indicateurId);
  if (!definition) return null;

  return <IndicateurPredefiniBase definition={definition} />;
};
