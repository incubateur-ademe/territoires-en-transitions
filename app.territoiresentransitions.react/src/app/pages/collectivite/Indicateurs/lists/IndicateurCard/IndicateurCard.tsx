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

import {
  IndicateurChartInfo,
  IndicateurListItem,
} from '@/api/indicateurs/domain';
import { transformeValeurs } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/detail/transformeValeurs';
import {
  IndicateurChartData,
  IndicateurChartProps,
} from '@/app/app/pages/collectivite/Indicateurs/chart/IndicateurChart';
import { useIndicateurChartInfo } from '@/app/app/pages/collectivite/Indicateurs/chart/useIndicateurChartInfo';
import BadgeIndicateurPerso from '@/app/app/pages/collectivite/Indicateurs/components/BadgeIndicateurPerso';
import BadgeOpenData from '@/app/app/pages/collectivite/Indicateurs/components/BadgeOpenData';
import IndicateurCardOptions from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardOptions';
import PictoIndicateurComplet from '@/app/ui/pictogrammes/PictoIndicateurComplet';
import PictoIndicateurVide from '@/app/ui/pictogrammes/PictoIndicateurVide';
import { BadgeACompleter } from '@/app/ui/shared/Badge/BadgeACompleter';
import IndicateurChartNew from '../../chart/IndicateurChartNew';
import { getIndicateurRestant } from './utils';

/** Props de la carte Indicateur */
export type IndicateurCardProps = {
  /** Item dans une liste d'indicateurs (avant que le détail pour la vignette ne soit chargé) */
  definition: IndicateurListItem;
  /** Permet de sélectionner ou dissocier l'indicateur */
  selectState?: {
    /**
     * Remplace le nom par un input checkbox.
     * Ne peux pas être utilisé avec la prop `href`.
     * Si `false`, le bouton de dissociation est affiché
     */
    checkbox?: boolean;
    selected: boolean;
    setSelected: (indicateur: IndicateurListItem) => void;
  };
  /** Rend la carte comme un lien. Ne peux pas être utilisé avec la prop `selectState` */
  href?: string;
  /** ClassName de la carte */
  className?: string;
  /** Props du composant `IndicateurChart` sans ce qui est relatif aux données */
  chart?: Omit<IndicateurChartProps, 'data' | 'isLoading'>;
  /** Affiche ou masque le graphique */
  hideChart?: boolean;
  /** Affiche ou masque le graphique quand il n'y a pas de valeur */
  hideChartWithoutValue?: boolean;
  /** Affiche les options de modification au hover de la carte */
  isEditable?: boolean;
  /** Permet d'ajouter des éléments dans le groupe de menus */
  otherMenuActions?: (indicateur: IndicateurListItem) => React.ReactNode[];
  /** Props du composant générique Card */
  card?: CardProps;
  /** Si l'utilisateur est lecteur ou non */
  readonly?: boolean;
  /** Indique si le rafraichissement des datas du graphique doit se faire automatiquement.
      `false` par défaut. */
  autoRefresh?: boolean;
};

/** Carte qui permet d'afficher un graphique dans une liste */
const IndicateurCard = ({
  autoRefresh = false,
  ...props
}: IndicateurCardProps) => {
  /** La carte ne peut pas être à la fois un  */
  if (props.selectState?.checkbox && !!props.href) {
    throw new Error(
      'IndicateurCard: checkbox et href ne peuvent pas être utilisés ensemble'
    );
  }

  // lit les données nécessaires à l'affichage du graphe
  const { data: chartInfo, isLoading } = useIndicateurChartInfo(
    props.definition.id,
    autoRefresh
  );

  // sépare les données objectifs/résultats
  const { valeurs } = transformeValeurs(chartInfo?.valeurs || []);

  // Assemblage des données pour le graphique
  const data = {
    unite: chartInfo?.unite,
    valeurs,
  };

  return (
    <IndicateurCardBase
      data={data}
      isLoading={isLoading}
      chartInfo={chartInfo}
      {...props}
    />
  );
};

export default IndicateurCard;

/** Props pour la story de la carte */
export type IndicateurCardBaseProps = IndicateurCardProps & {
  data: IndicateurChartData;
  isLoading: boolean;
  chartInfo?: IndicateurChartInfo | null;
};

/**
 * Utilisé commme base de `IndicateurCard`.
 * Ne pas utilisé ce composant directement, il est uniquement créé pour pouvoir faire une story de la carte indicateur.
 */
export const IndicateurCardBase = ({
  data,
  selectState,
  href,
  className,
  isLoading,
  definition,
  chart,
  chartInfo,
  isEditable = false,
  hideChart = false,
  hideChartWithoutValue = false,
  otherMenuActions,
  card,
  readonly,
}: IndicateurCardBaseProps) => {
  const [isDownloadChartOpen, setIsDownloadChartOpen] = useState(false);

  const showChart =
    (!hideChart && !hideChartWithoutValue) ||
    (hideChartWithoutValue && data.valeurs.length > 0);

  const isIndicateurParent = chartInfo?.enfants && chartInfo.enfants.length > 0;

  // uniquement utilisé pour `totalNbIndicateurs`
  const totalEnfants = chartInfo?.enfants?.length;
  /** Nombre total d'indicateurs, qu'il y ait des enfants ou non */
  const totalNbIndicateurs = chartInfo?.sansValeur
    ? totalEnfants
    : (totalEnfants ?? 0) + 1;

  /** Nombre total d'indicateurs restant à compléter, qu'il y ait des enfants ou non */
  const indicateursACompleterRestant =
    (chartInfo && getIndicateurRestant(chartInfo)) ?? 0;

  /** Rempli ne peut pas être utilisé pour l'affichage car les objectifs ne sont pas pris en compte mais doivent quand même apparaître */
  const hasValeurOrObjectif =
    data.valeurs.filter((v) => typeof v.valeur === 'number').length > 0;

  const isNotLoadingNotFilled = !isLoading && !hasValeurOrObjectif;

  const isACompleter = chartInfo?.sansValeur
    ? indicateursACompleterRestant > 0
    : !chartInfo?.rempli;

  return (
    <div className="group relative h-full">
      {/** Cadenas indicateur privé */}
      {chartInfo?.confidentiel && (
        <Tooltip label="La dernière valeur de cet indicateur est en mode privé">
          <div className="absolute -top-5 left-5">
            <Notification icon="lock-fill" size="sm" classname="w-9 h-9" />
          </div>
        </Tooltip>
      )}

      {/** Menus d'édition */}
      {!readonly && isEditable && (
        <IndicateurCardOptions
          definition={definition}
          isFavoriCollectivite={chartInfo?.favoriCollectivite}
          otherMenuActions={otherMenuActions}
          chartDownloadSettings={{
            showTrigger: showChart && hasValeurOrObjectif,
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
            onChange={() =>
              selectState.setSelected({
                id: definition.id,
                titre: definition.titre,
                estPerso: definition.estPerso,
                identifiant: definition.identifiant || null,
                // description: chartInfo?.titreLong ?? '',
                // unite: chartInfo?.unite ?? '',
                hasOpenData: definition.hasOpenData,
              })
            }
            label={chartInfo?.titre}
            labelClassname="!font-bold"
          />
        ) : (
          <>
            <div className="max-w-full font-bold line-clamp-2 text-primary-10">
              {chartInfo?.titre}{' '}
              {chartInfo?.unite && (
                <span className="font-normal text-grey-6">
                  ({chartInfo?.unite})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <BadgeACompleter a_completer={isACompleter} size="sm" />
              {definition.estPerso && <BadgeIndicateurPerso size="sm" />}
              {definition.hasOpenData && <BadgeOpenData size="sm" />}
            </div>
          </>
        )}

        {/** Graphique */}
        {showChart && (
          <div className="mt-auto">
            {isIndicateurParent &&
            chartInfo?.sansValeur &&
            indicateursACompleterRestant === 0 ? (
              <EmptyCard
                size="xs"
                className="h-80"
                picto={(props) => <PictoIndicateurComplet {...props} />}
                subTitle={`${totalNbIndicateurs}/${totalNbIndicateurs} complétés`}
              />
            ) : data.valeurs.length === 0 ? (
              <EmptyCard
                size="xs"
                className="h-80"
                picto={(props) => <PictoIndicateurVide {...props} />}
                actions={
                  !readonly && !!href
                    ? [{ children: "Compléter l'indicateur" }]
                    : undefined
                }
              />
            ) : (
              // todo: gérer le téléchargement png (via la modale ?)
              <IndicateurChartNew data={data} isLoading={isLoading} size="sm" />
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
                {hasValeurOrObjectif &&
                  ((isIndicateurParent &&
                    !(
                      chartInfo?.sansValeur &&
                      indicateursACompleterRestant === 0
                    )) ||
                    chartInfo.participationScore) && (
                    <div className="h-px bg-primary-3" />
                  )}
                {(isIndicateurParent || chartInfo.participationScore) && (
                  <div className="flex flex-wrap gap-2 items-center text-xs text-grey-8 mt-3">
                    {/* Nombre d'indicateurs */}
                    {isIndicateurParent && totalNbIndicateurs && (
                      <div>
                        {totalNbIndicateurs - indicateursACompleterRestant}/
                        {totalNbIndicateurs} indicateur
                        {totalNbIndicateurs > 1 && 's'}
                      </div>
                    )}
                    {/** Barre verticale */}
                    {isIndicateurParent &&
                      totalNbIndicateurs &&
                      chartInfo.participationScore && (
                        <div className="w-px h-3 bg-grey-5" />
                      )}
                    {/** Participation au score */}
                    {chartInfo.participationScore && (
                      <div>Participe au score Climat Air Énergie</div>
                    )}
                  </div>
                )}
              </>
            ) : (
              isACompleter &&
              !readonly &&
              href && (
                // Compléter indicateur bouton
                <Button size="xs">Compléter l’indicateur</Button>
              )
            ))}
        </div>
      </Card>
    </div>
  );
};
