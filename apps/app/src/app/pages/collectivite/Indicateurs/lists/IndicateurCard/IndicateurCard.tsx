import { appLabels } from '@/app/labels/catalog';
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
} from '@tet/ui';

import BadgeIndicateurPerso from '@/app/app/pages/collectivite/Indicateurs/components/BadgeIndicateurPerso';
import BadgeOpenData from '@/app/app/pages/collectivite/Indicateurs/components/BadgeOpenData';
import IndicateurCardOptions from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardOptions';
import {
  type IndicateurDetaille,
  isIndicateurPerso,
} from '@tet/domain/indicateurs';
import ChartLegend, { AreaSymbol } from '@/app/ui/charts/ChartLegend';
import PictoIndicateurVide from '@/app/ui/pictogrammes/PictoIndicateurVide';
import DownloadIndicateurChartModal from '../../chart/DownloadIndicateurChart';
import IndicateurChart from '../../chart/IndicateurChart';
import {
  IndicateurChartInfo,
  useIndicateurChartInfo,
} from '../../data/use-indicateur-chart';
import { IndicateurCardSkeleton } from './indicateur-card.skeleton';

/** Props de la carte Indicateur */
export type IndicateurCardProps = {
  /** Item dans une liste d'indicateurs (avant que le détail pour la vignette ne soit chargé) */
  indicateur: IndicateurDetaille;

  /**
   * Id de la collectivité pour laquelle on veut voir les valeurs, si non défini, on utilise la collectivité courante
   */
  externalCollectiviteId?: number;
  /** Sources affichées séparément, exclues de ce graphique. */
  excludedSources?: string[];
  /** Complément sous le graphique, sans remplacer les valeurs ordinaires. */
  additionalContent?: React.ReactNode;

  /** Permet de sélectionner ou dissocier l'indicateur */
  selectState?: {
    /**
     * Remplace le nom par un input checkbox.
     * Ne peux pas être utilisé avec la prop `href`.
     * Si `false`, le bouton de dissociation est affiché
     */
    checkbox?: boolean;
    selected: boolean;
    setSelected: (indicateur: IndicateurDetaille) => void;
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
  otherMenuActions?: (indicateur: IndicateurDetaille) => React.ReactNode[];
  /** Props du composant générique Card */
  card?: CardProps;
  /** Si l'utilisateur est lecteur ou non */
  readonly?: boolean;
};

/** Carte qui permet d'afficher un graphique dans une liste */
const IndicateurCard = ({
  indicateur,
  externalCollectiviteId,
  excludedSources,
  selectState,
  href,
  ...props
}: IndicateurCardProps) => {
  /** La carte ne peut pas être à la fois un lien et une carte sélectionnable */
  if (selectState?.checkbox && !!href) {
    throw new Error(
      'IndicateurCard: checkbox et href ne peuvent pas être utilisés ensemble'
    );
  }

  // lit les données nécessaires à l'affichage du graphe
  const chartInfo = useIndicateurChartInfo({
    indicateur,
    externalCollectiviteId,
    excludedSources,
  });

  if (chartInfo.isLoading) {
    return <IndicateurCardSkeleton />;
  }

  return (
    <IndicateurCardBase
      indicateur={indicateur}
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
  indicateur: indicateurSimple,
  selectState,
  href,
  className,
  isEditable = false,
  hideChart = false,
  hideChartWithoutValue = false,
  otherMenuActions,
  card,
  readonly,
  additionalContent,
}: IndicateurCardBaseProps) => {
  const [isDownloadChartOpen, setIsDownloadChartOpen] = useState(false);

  const {
    definition: indicateur,
    hasValeur,
    segmentItemParId,
    isLoading,
  } = chartInfo;
  if (!indicateur) {
    return;
  }

  const showChart =
    (!hideChart && !hideChartWithoutValue) ||
    (hideChartWithoutValue && hasValeur);

  const totalEnfants = indicateur.enfants?.length ?? 0;
  const isIndicateurParent = totalEnfants > 0;
  const estGroupement = isIndicateurParent && !indicateur.estAgregation;

  return (
    <>
      <div className="group relative h-full">
        {/** Cadenas indicateur privé */}
        {indicateur?.estConfidentiel && (
          <Tooltip label={appLabels.derniereValeurIndicateurModePrive}>
            <div className="absolute -top-5 left-5">
              <Notification icon="lock-fill" size="sm" classname="w-9 h-9" />
            </div>
          </Tooltip>
        )}

        {/** Actions de la carte */}
        <IndicateurCardOptions
          indicateur={indicateurSimple}
          isEditable={isEditable && !readonly}
          isFavoriCollectivite={indicateur.estFavori || false}
          otherMenuActions={readonly ? undefined : otherMenuActions}
          chartDownloadSettings={{
            showTrigger: Boolean(!readonly && showChart && hasValeur),
            openModal: () => setIsDownloadChartOpen(true),
          }}
        />

        {/* Carte indicateur */}
        <Card
          dataTest={`chart-${indicateur.id}`}
          className={classNames('h-full font-normal !gap-3 !p-6', className)}
          isSelected={selectState?.checkbox && selectState?.selected}
          href={href}
          {...card}
        >
          {/* En-tête de la carte, avec ou sans checkbox */}
          {selectState?.checkbox ? (
            <Checkbox
              checked={selectState.selected}
              onChange={() => selectState.setSelected(indicateur)}
              label={indicateur.titre}
              labelClassname="!font-bold"
            />
          ) : (
            <>
              <div className="max-w-full font-bold line-clamp-2 text-primary-10">
                {indicateur.titre}{' '}
                {indicateur.unite && (
                  <span className="font-normal text-grey-6">
                    {`(${indicateur.unite})`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {isIndicateurPerso(indicateur) && <BadgeIndicateurPerso />}
                {indicateur.hasOpenData && <BadgeOpenData />}
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
                          {appLabels.indicateursDansCeGroupeCount({
                            count: totalEnfants,
                          })}
                        </p>
                      ) : null}
                    </>
                  )}
                  actions={
                    !readonly && !!href && !estGroupement
                      ? [{ children: appLabels.completerIndicateur }]
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

          {additionalContent}

          {/** Partie sous le séparateur horizontal */}
          <div
            className={classNames({ 'h-7': showChart, 'mt-auto': !showChart })}
          >
            {chartInfo &&
              (showChart ? (
                <>
                  {/** Barre horizontale */}
                  {(isIndicateurParent || indicateur.participationScore) && (
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
                                {appLabels.sousIndicateurAjoutCount({
                                  count: totalEnfants,
                                })}
                              </span>
                            </Tooltip>
                          ) : (
                            <Tooltip
                              label={
                                <ul>
                                  {indicateur.enfants?.map((enfant) => (
                                    <li key={enfant.id}>{enfant.titre}</li>
                                  ))}
                                </ul>
                              }
                            >
                              <span>
                                {appLabels.indicateur({ count: totalEnfants })}
                              </span>
                            </Tooltip>
                          ))}
                        {/** Barre verticale */}
                        {isIndicateurParent &&
                          totalEnfants &&
                          indicateur.participationScore && (
                            <div className="w-px h-3 bg-grey-5" />
                          )}
                        {/** Participation au score */}
                        {indicateur.participationScore && (
                          <div>{appLabels.indicateurParticipeAuScore}</div>
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
                  <Button size="xs">{appLabels.completerIndicateur}</Button>
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
        title={indicateur?.titre}
      />
    </>
  );
};
