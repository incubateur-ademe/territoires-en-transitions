import { Indicateurs } from '@/api';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import {
  Alert,
  Badge,
  Button,
  Field,
  Modal,
  ModalFooterOKCancel,
  Select,
  TrackPageView,
  useEventTracker,
} from '@/ui';
import { pick } from 'es-toolkit';
import { useState } from 'react';
import { SOURCE_COLLECTIVITE, getSourceTypeLabel } from '../../constants';
import { TIndicateurDefinition } from '../../types';
import { ApplyOpenDataModal } from './ApplyOpenDataModal';
import { useApplyOpenData, useOpenDataComparaison } from './useApplyOpenData';

/**
 * Affiche le sélecteur des sources de données d'un indicateur, lorsqu'il
 * y en a plusieurs. Sinon rien n'est affiché.
 */
export const ImportSourcesSelector = ({
  definition,
  sources,
  currentSource,
  setCurrentSource,
}: {
  definition: TIndicateurDefinition;
  sources: Indicateurs.fetch.IndicateurImportSource[];
  currentSource: string;
  setCurrentSource: (value: string) => void;
}) => {
  // utilitaire pour faire correspondre les index d'onglet aux id de source
  const { indexedSources, idToIndex, indexToId, getSourceType } =
    useIndexedSources(sources);

  // source sélectionnée
  const source = sources.find((s) => s.id === currentSource);
  const sourceType = getSourceType(source);
  const sourceTypeLabel = getSourceTypeLabel(sourceType);

  // collectivité courante
  const collectivite = useCurrentCollectivite()!;
  const collectiviteId = collectivite.collectiviteId;

  // compare les données open-data avec les données courantes (si la source est externe)
  const openDataComparaison = useOpenDataComparaison({
    collectiviteId,
    definition,
    importSource: currentSource,
  });
  const comparaison =
    openDataComparaison && sourceType
      ? openDataComparaison[`${sourceType}s`]
      : null;

  // détermine si le bouton "appliquer à mes objectifs/résultats" doit être affiché
  const canApplyOpenData =
    collectivite &&
    !collectivite.isReadOnly &&
    currentSource !== SOURCE_COLLECTIVITE &&
    sourceType &&
    !!(comparaison?.conflits || comparaison?.ajouts);

  // mutation pour appliquer les données
  const { mutate: applyOpenData } = useApplyOpenData({
    definition,
    source,
  });

  // état local de la modale de résolution des conflits
  const [isOpen, setIsOpen] = useState(false);
  const [overwrite, setOverwrite] = useState(false);

  const trackEvent = useEventTracker('app/indicateurs/predefini');

  return indexedSources && setCurrentSource ? (
    /** onglets de sélection de la source si il y a des sources open-data dispo */
    <>
      <Field title="" className="w-96">
        <Select
          values={currentSource}
          options={indexedSources.map(({ id, libelle }) => ({
            value: id,
            label: libelle,
          }))}
          onChange={(value) => {
            const sourceId = value as string;
            setCurrentSource(sourceId);
            if (sourceId !== SOURCE_COLLECTIVITE && sourceType)
              trackEvent('view_open_data', {
                ...collectivite,
                indicateurId: String(definition.id),
                sourceId: sourceId,
                type: sourceType,
              });
          }}
          customItem={(option) => <Badge title={option.label} />}
        />
      </Field>

      {canApplyOpenData && (
        /** bandeau & bouton "appliquer à mes objectifs/résultats" */
        <>
          <Alert
            state="info"
            title={`Vous pouvez appliquer ces données à vos ${sourceTypeLabel} : les données seront alors disponibles dans le tableau “Mes données” et seront éditables`}
            footer={
              <Button
                data-test={`apply-${sourceType}`}
                size="sm"
                onClick={() => {
                  // ouvrir le dialogue de résolution des conflits si nécessaire
                  if (comparaison?.conflits) {
                    if (!source || !sourceType) return;
                    setIsOpen(true);
                  } else {
                    // applique les changements si nécessaire
                    applyOpenData({ overwrite: false });
                  }
                }}
              >
                Appliquer à mes {sourceTypeLabel}
              </Button>
            }
          />
          {canApplyOpenData && isOpen && source && sourceType && (
            /** modale de résolution des conflits */
            <Modal
              dataTest="conflits"
              size="xl"
              openState={{ isOpen, setIsOpen }}
              title={`Appliquer les ${sourceTypeLabel} ${source.libelle}`}
              render={() => (
                <>
                  <TrackPageView
                    pageName="app/indicateurs/predefini/conflits"
                    properties={{
                      ...pick(collectivite, [
                        'collectiviteId',
                        'niveauAcces',
                        'role',
                      ]),
                      indicateurId: String(definition.id),
                    }}
                  />
                  <ApplyOpenDataModal
                    comparaison={comparaison}
                    definition={definition}
                    source={source}
                    overwrite={overwrite}
                    setOverwrite={setOverwrite}
                  />
                </>
              )}
              renderFooter={({ close }) => (
                <ModalFooterOKCancel
                  btnCancelProps={{ onClick: close }}
                  btnOKProps={{
                    onClick: () => {
                      // applique les changements si nécessaire
                      applyOpenData({ overwrite });
                      close();
                    },
                  }}
                />
              )}
            />
          )}
        </>
      )}
    </>
  ) : null;
};

/*
 * Ajoute la source "mes données" à l'index 0 et renvoi des fonctions
 * utilitaires pour transformer les id en index et réciproquement.
 */
const useIndexedSources = (
  sources?: Indicateurs.fetch.IndicateurImportSource[] | null
) => {
  // ajoute la source "mes données"
  const indexedSources = sources?.length
    ? [{ id: SOURCE_COLLECTIVITE, libelle: 'Mes données' }, ...sources]
    : null;

  // converti un id de source en index
  const idToIndex = (id: string) => {
    if (id === SOURCE_COLLECTIVITE) {
      return 0;
    }
    const index = indexedSources?.findIndex((s) => s.id === id);
    return index === -1 || index === undefined ? 0 : index;
  };

  // converti un index en id de source
  const indexToId = (index: number) =>
    index === 0
      ? SOURCE_COLLECTIVITE
      : indexedSources?.[index]?.id ?? SOURCE_COLLECTIVITE;

  // donne les types de données disponibles pour une source
  const getSourceType = (
    source: Indicateurs.fetch.IndicateurImportSource | undefined
  ) => {
    return source && source.id !== SOURCE_COLLECTIVITE ? source.type : null;
  };

  return { indexedSources, idToIndex, indexToId, getSourceType };
};
