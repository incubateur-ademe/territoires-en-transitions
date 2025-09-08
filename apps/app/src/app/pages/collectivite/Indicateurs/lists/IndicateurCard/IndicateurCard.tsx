import classNames from 'classnames';
import { useState } from 'react';

import {
  Button,
  Card,
  CardProps,
  Checkbox,
  EmptyCard,
  Notification,
  Tooltip,
} from '@/ui';

import BadgeIndicateurPerso from '@/app/app/pages/collectivite/Indicateurs/components/BadgeIndicateurPerso';
import BadgeOpenData from '@/app/app/pages/collectivite/Indicateurs/components/BadgeOpenData';
import IndicateurCardOptions from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardOptions';
import { IndicateurDefinitionListItem } from '@/app/indicateurs/definitions/use-list-indicateur-definitions';
import ChartLegend, { AreaSymbol } from '@/app/ui/charts/ChartLegend';
import PictoIndicateurVide from '@/app/ui/pictogrammes/PictoIndicateurVide';
import DownloadIndicateurChartModal from '../../chart/DownloadIndicateurChart';
import IndicateurChart from '../../chart/IndicateurChart';
import {
  IndicateurChartInfo,
  useIndicateurChartInfo,
} from '../../data/use-indicateur-chart';

/** Props de la carte Indicateur */
export type IndicateurCardProps = {
  /** Item dans une liste d'indicateurs (avant que le détail pour la vignette ne soit chargé) */
  definition: IndicateurDefinitionListItem;

  /**
   * Id de la collectivité pour laquelle on veut voir les valeurs, si non défini, on utilise la collectivité courante
   */
  externalCollectiviteId?: number;

  /** Permet de sélectionner ou dissocier l'indicateur */
  selectState?: {
    /**
     * Remplace le nom par un input checkbox.
     * Ne peux pas être utilisé avec la prop `href`.
     * Si `false`, le bouton de dissociation est affiché
     */
    checkbox?: boolean;
    selected: boolean;
    setSelected: (indicateur: IndicateurDefinitionListItem) => void;
  };
  /** Rend la carte comme un lien. Ne peux pas être utilisé avec la prop `selectState` */
  href?: string;
  /** ClassName de la carte */
  className?: string;
  /** Affiche ou masque le graphique */
  hideChart?: boolean;
  /** Affiche ou masque le graphique quand il n'y a pas de valeur */
  hideChartWithoutValue?: boolean;
  /** Affiche les options de modification au hover de la carte */
  isEditable?: boolean;
  /** Permet d'ajouter des éléments dans le groupe de menus */
  otherMenuActions?: (
    indicateur: IndicateurDefinitionListItem
  ) => React.ReactNode[];
  /** Props du composant générique Card */
  card?: CardProps;
  /** Si l'utilisateur est lecteur ou non */
  readonly?: boolean;
};

/** Carte qui permet d'afficher un graphique dans une liste */
const IndicateurCard = ({
  definition,
  externalCollectiviteId,
  selectState,
  href,
  ...props
}: IndicateurCardProps) => {
  /** La carte ne peut pas être à la fois un  */
  if (selectState?.checkbox && !!href) {
    throw new Error(
      'IndicateurCard: checkbox et href ne peuvent pas être utilisés ensemble'
    );
  }

  // lit les données nécessaires à l'affichage du graphe
  const chartInfo = useIndicateurChartInfo({
    definition,
    externalCollectiviteId: externalCollectiviteId,
  });

  return (
    <IndicateurCardBase
      definition={definition}
      chartInfo={chartInfo}
      externalCollectiviteId={externalCollectiviteId}
      selectState={selectState}
      href={href}
      {...props}
    />
  );
};

export default IndicateurCard;

/** Props pour la story de la carte */
export type IndicateurCardBaseProps = IndicateurCardProps & {
  chartInfo: IndicateurChartInfo;
};

/**
 * Utilisé commme base de `IndicateurCard`.
 * Ne pas utilisé ce composant directement, il est uniquement créé pour pouvoir faire une story de la carte indicateur.
 */
export const IndicateurCardBase = ({
  chartInfo,
  definition: definitionSimple,
  selectState,
  href,
  className,
  isEditable = false,
  hideChart = false,
  hideChartWithoutValue = false,
  otherMenuActions,
  card,
  readonly,
}: IndicateurCardBaseProps) => {
  const [isDownloadChartOpen, setIsDownloadChartOpen] = useState(false);

  const { definition, hasValeur, segmentItemParId, isLoading } = chartInfo;
  if (!definition) {
    return;
  }

  const showChart =
    (!hideChart && !hideChartWithoutValue) ||
    (hideChartWithoutValue && hasValeur);

  const totalEnfants = definition.enfants?.length ?? 0;
  const isIndicateurParent = totalEnfants > 0;
  const estGroupement = isIndicateurParent && !definition.estAgregation;

  return (
    <>
      <div className="group relative h-full">
        {/** Cadenas indicateur privé */}
        {definition?.estConfidentiel && (
          <Tooltip label="La dernière valeur de cet indicateur est en mode privé">
            <div className="absolute -top-5 left-5">
              <Notification icon="lock-fill" size="sm" classname="w-9 h-9" />
            </div>
          </Tooltip>
        )}

        {/** Menus d'édition */}
        {!readonly && isEditable && (
          <IndicateurCardOptions
            definition={definitionSimple}
            isFavoriCollectivite={definition.estFavori || false}
            otherMenuActions={otherMenuActions}
            chartDownloadSettings={{
              showTrigger: Boolean(showChart && hasValeur),
              openModal: () => setIsDownloadChartOpen(true),
            }}
          />
        )}

        {/* Carte indicateur */}
        <Card
          dataTest={`chart-${definition.id}`}
          className={classNames('h-full font-normal !gap-3 !p-6', className)}
          isSelected={selectState?.checkbox && selectState?.selected}
          href={href}
          {...card}
        >
          {/* En-tête de la carte, avec ou sans checkbox */}
          {selectState?.checkbox ? (
            <Checkbox
              checked={selectState.selected}
              onChange={
                () => selectState.setSelected(definition)
                // selectState.setSelected({
                //   id: definition.id,
                //   titre: definition.titre,
                //   estPerso: definition.estPerso,
                //   identifiantReferentiel:
                //     definition.identifiantReferentiel || null,
                //   // description: chartInfo?.titreLong ?? '',
                //   // unite: chartInfo?.unite ?? '',
                //   hasOpenData: definition.hasOpenData || false,
                // })
              }
              label={definition.titre}
              labelClassname="!font-bold"
            />
          ) : (
            <>
              <div className="max-w-full font-bold line-clamp-2 text-primary-10">
                {definition.titre}{' '}
                {definition.unite && (
                  <span className="font-normal text-grey-6">
                    ({definition.unite})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {definition.estPerso && <BadgeIndicateurPerso size="sm" />}
                {definition.hasOpenData && <BadgeOpenData size="sm" />}
              </div>
            </>
          )}

          {/** Graphique */}
          {showChart && (
            <div className="mt-auto">
              {!hasValeur ? (
                <EmptyCard
                  size="xs"
                  className="h-80"
                  picto={(props) => (
                    <>
                      <PictoIndicateurVide {...props} />
                      {estGroupement ? (
                        <p className="text-primary-9 text-lg font-bold">
                          {totalEnfants} indicateur{totalEnfants > 1 ? 's' : ''}{' '}
                          dans ce groupe
                        </p>
                      ) : null}
                    </>
                  )}
                  actions={
                    !readonly && !!href && !estGroupement
                      ? [{ children: "Compléter l'indicateur" }]
                      : undefined
                  }
                />
              ) : (
                <IndicateurChart
                  chartInfo={chartInfo}
                  isLoading={isLoading}
                  variant="thumbnail"
                />
              )}
            </div>
          )}

          {/** Partie sous le séparateur horizontal */}
          <div
            className={classNames({ 'h-7': showChart, 'mt-auto': !showChart })}
          >
            {chartInfo &&
              (showChart ? (
                <>
                  {/** Barre horizontale */}
                  {(isIndicateurParent || definition.participationScore) && (
                    <>
                      <div className="h-px bg-primary-3" />
                      <div className="flex flex-wrap gap-2 items-center text-xs text-grey-8 mt-3">
                        {/* infobulle avec la légende des sous-indicateurs */}
                        {isIndicateurParent &&
                          totalEnfants &&
                          (segmentItemParId.size ? (
                            <Tooltip
                              label={
                                <ChartLegend
                                  className="flex-col items-baseline pb-3 px-4"
                                  isOpen
                                  items={Array.from(
                                    segmentItemParId.values()
                                  ).map(({ name, color }) => ({
                                    name,
                                    color,
                                    symbole: AreaSymbol,
                                  }))}
                                />
                              }
                            >
                              {/* Nombre de sous-indicateurs */}
                              <span>
                                {`+${totalEnfants} sous-indicateur`}
                                {totalEnfants > 1 && 's'}
                              </span>
                            </Tooltip>
                          ) : (
                            <Tooltip
                              label={
                                <ul>
                                  {definition.enfants?.map((enfant) => (
                                    <li key={enfant.id}>{enfant.titre}</li>
                                  ))}
                                </ul>
                              }
                            >
                              <span>
                                {`${totalEnfants} indicateur`}
                                {totalEnfants > 1 && 's'}
                              </span>
                            </Tooltip>
                          ))}
                        {/** Barre verticale */}
                        {isIndicateurParent &&
                          totalEnfants &&
                          definition.participationScore && (
                            <div className="w-px h-3 bg-grey-5" />
                          )}
                        {/** Participation au score */}
                        {definition.participationScore && (
                          <div>Participe au score Climat Air Énergie</div>
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                !hasValeur &&
                !readonly &&
                href && (
                  // Compléter indicateur bouton
                  <Button size="xs">Compléter l’indicateur</Button>
                )
              ))}
          </div>
        </Card>
      </div>
      <DownloadIndicateurChartModal
        openState={{
          isOpen: isDownloadChartOpen,
          setIsOpen: setIsDownloadChartOpen,
        }}
        chartInfo={chartInfo}
        isLoading={isLoading}
        title={definition?.titre}
      />
    </>
  );
};
