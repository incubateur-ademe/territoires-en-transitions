import classNames from 'classnames';

import {Button, Card, CardProps, Checkbox, Tooltip} from '@tet/ui';
import {Notification} from '@tet/ui';

import IndicateurChart, {
  IndicateurChartData,
  IndicateurChartProps,
} from 'app/pages/collectivite/Indicateurs/chart/IndicateurChart';
import {useIndicateurChartInfo} from 'app/pages/collectivite/Indicateurs/chart/useIndicateurChartInfo';
import {
  Indicateur,
  TIndicateurChartInfo,
  TIndicateurListItem,
} from 'app/pages/collectivite/Indicateurs/types';
import {
  generateLineLegendItems,
  getLeftLineChartMargin,
} from 'ui/charts/Line/utils';
import {prepareData} from 'app/pages/collectivite/Indicateurs/chart/utils';
import PictoIndicateurComplet from 'ui/pictogrammes/PictoIndicateurComplet';
import {getIndicateurRestant} from './utils';
import {BadgeACompleter} from 'ui/shared/Badge/BadgeACompleter';
import {transformeValeurs} from 'app/pages/collectivite/Indicateurs/Indicateur/detail/transformeValeurs';

/** Props de la carte Indicateur */
export type IndicateurCardProps = {
  /** Item dans une liste d'indicateurs (avant que le détail pour la vignette ne soit chargé) */
  definition: TIndicateurListItem;
  /** Permet de sélectionner ou dissocier l'indicateur */
  selectState?: {
    /**
     * Remplace le nom par un input checkbox.
     * Ne peux pas être utilisé avec la prop `href`.
     * Si `false`, le bouton de dissociation est affiché
     */
    checkbox?: boolean;
    selected: boolean;
    setSelected: (indicateur: Indicateur) => void;
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
  const {data: chartInfo, isLoading} = useIndicateurChartInfo(
    props.definition.id,
    autoRefresh
  );

  // sépare les données objectifs/résultats
  const {valeurs} = transformeValeurs(chartInfo?.valeurs || []);

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
  chartInfo?: TIndicateurChartInfo | null;
};

/**
 * Utilisé commme base de `IndicateurCard`.
 * Ne pas utilisé ce composant directement, il est uniquement créé pour pouvoir faire une story de la carte indicateur.
 */
const IndicateurCardBase = ({
  data,
  selectState,
  href,
  className,
  isLoading,
  definition,
  chart,
  chartInfo,
  hideChart = false,
  hideChartWithoutValue = false,
  card,
  readonly,
}: IndicateurCardBaseProps) => {
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
    data.valeurs.filter(v => typeof v.valeur === 'number').length > 0;

  const isNotLoadingNotFilled = !isLoading && !hasValeurOrObjectif;

  const isACompleter = chartInfo?.sansValeur
    ? indicateursACompleterRestant > 0
    : !chartInfo?.rempli;

  return (
    <Card
      dataTest={`chart-${definition.id}`}
      className={classNames(
        'relative font-normal !gap-3',
        {'border-primary-7': selectState?.checkbox && selectState?.selected},
        className
      )}
      href={href}
      {...card}
    >
      {chartInfo?.confidentiel && (
        <Tooltip label="La dernière valeur de cet indicateur est en mode privé">
          <div className="absolute -top-5 left-5">
            <Notification icon="lock-fill" size="sm" classname="w-9 h-9" />
          </div>
        </Tooltip>
      )}
      {selectState?.checkbox ? (
        <Checkbox
          checked={selectState.selected}
          onChange={() =>
            selectState.setSelected({
              id: definition.id,
              titre: definition.titre,
              estPerso: definition.estPerso,
              identifiant: definition.identifiant || null,
              description: chartInfo?.titreLong ?? '',
              unite: chartInfo?.unite ?? '',
            })
          }
          label={chartInfo?.titre}
          labelClassname="!font-bold"
        />
      ) : (
        <>
          <div className="flex items-center gap-6">
            <BadgeACompleter a_completer={isACompleter} size="sm" />
            {selectState?.setSelected && (
              <Button
                onClick={(
                  evt: React.MouseEvent<HTMLButtonElement, MouseEvent>
                ) => {
                  evt.preventDefault();
                  evt.stopPropagation();
                  selectState.setSelected({
                    id: definition.id,
                    titre: definition.titre,
                    estPerso: definition.estPerso,
                    identifiant: definition.identifiant || null,
                    description: chartInfo?.titreLong ?? '',
                    unite: chartInfo?.unite ?? '',
                  });
                }}
                icon="link-unlink"
                title="Dissocier l'indicateur"
                size="xs"
                variant="grey"
                className="ml-auto hidden group-hover:flex -my-2"
              />
            )}
          </div>
          <div className="font-bold line-clamp-2">{chartInfo?.titre}</div>
        </>
      )}
      {/** Graphique */}
      {showChart && (
        <>
          {isIndicateurParent &&
          chartInfo?.sansValeur &&
          indicateursACompleterRestant === 0 ? (
            <div className="flex flex-col grow justify-center items-center gap-3 min-h-[18rem] bg-primary-0 rounded-lg">
              <PictoIndicateurComplet />
              <div className="font-medium text-primary-8">
                {totalNbIndicateurs}/{totalNbIndicateurs} complétés
              </div>
            </div>
          ) : (
            <div
              className={classNames('flex flex-col grow', {
                'min-h-[18rem] justify-center items-center gap-3 bg-primary-0 rounded-lg':
                  isNotLoadingNotFilled,
              })}
            >
              <IndicateurChart
                data={data}
                isLoading={isLoading}
                className={classNames(
                  {'grow-0': isNotLoadingNotFilled},
                  {'!items-end': chartInfo?.rempli},
                  chart?.className
                )}
                chartConfig={{
                  className: '!h-[14rem]',
                  theme: {
                    axis: {
                      ticks: {
                        text: {
                          fontSize: 12,
                        },
                      },
                    },
                  },
                  margin: {
                    top: 16,
                    right: 4,
                    bottom: 32,
                    left: getLeftLineChartMargin(data.valeurs) + 4,
                  },
                  gridXValues: 4,
                  gridYValues: 4,
                  ...chart?.chartConfig,
                }}
              />
              {isNotLoadingNotFilled && !readonly && !!href && (
                <Button size="xs" className="mx-auto">
                  Compléter
                </Button>
              )}
              {/** Légende */}
              {hasValeurOrObjectif && (
                <div className="flex flex-wrap gap-4 ml-2 mt-2">
                  {generateLineLegendItems(prepareData(data.valeurs)).map(
                    ({name, color, symbole}) => (
                      <div key={name} className="flex items-center gap-2">
                        {!!symbole ? (
                          symbole(color)
                        ) : (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{backgroundColor: color}}
                          />
                        )}
                        <div className="text-xs text-grey-8">{name}</div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
      {/** Partie sous le séparateur horizontal */}
      {chartInfo &&
        (showChart ? (
          <>
            {/** Barre horizontale */}
            {hasValeurOrObjectif &&
              (isIndicateurParent || chartInfo.participationScore) && (
                <div className="h-px bg-primary-3" />
              )}
            {(isIndicateurParent || chartInfo.participationScore) && (
              <div className="flex flex-wrap gap-2 items-center text-sm text-grey-8">
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
            <>
              {/** Barre horizontale */}
              <div className="h-px bg-primary-3" />
              {/** Compléter indicateur bouton */}
              <Button size="xs">Compléter l’indicateur</Button>
            </>
          )
        ))}
    </Card>
  );
};
