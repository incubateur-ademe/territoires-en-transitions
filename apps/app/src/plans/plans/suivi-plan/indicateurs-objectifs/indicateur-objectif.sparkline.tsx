import {
  IndicateurObjectifHorizon,
  IndicateurResultat,
} from '@tet/domain/plans';
import { cn } from '@tet/ui/utils/cn';

const WIDTH = 320;
const HEIGHT = 120;
const PADDING = { left: 8, right: 28, top: 16, bottom: 22 };
const MIN_TICK_GAP = 32;
// Une année au bord gauche s'y aligne au lieu d'être centrée et rognée.
const EDGE_LABEL_ZONE = 12;

type Point = { x: number; valeur: number };

// Une date de valeur en année décimale : les périodicités infra-annuelles se
// placent entre deux années.
const toAnnee = (dateValeur: string) => {
  const [annee, mois] = dateValeur.split('-').map(Number);
  return annee + ((mois || 1) - 1) / 12;
};

const toPath = (points: { x: number; y: number }[]) =>
  points
    .map(
      ({ x, y }, index) => `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
    )
    .join(' ');

/**
 * La mini-courbe d'une carte : les résultats en trait plein, puis les objectifs
 * jusqu'à l'horizon en pointillés depuis le dernier résultat. La couleur suit
 * celle du texte : primaire, ou info pour une donnée open data.
 */
export const IndicateurObjectifSparkline = ({
  resultats,
  objectifs,
  cible,
  isOpenData,
  formatValeur,
}: {
  resultats: IndicateurResultat[];
  objectifs: IndicateurObjectifHorizon[];
  cible: IndicateurObjectifHorizon | null;
  isOpenData: boolean;
  formatValeur: (valeur: number) => string;
}) => {
  const serie: Point[] = resultats.map(({ dateValeur, valeur }) => ({
    x: toAnnee(dateValeur),
    valeur,
  }));
  const projection: Point[] = objectifs.map(({ annee, valeur }) => ({
    x: annee,
    valeur,
  }));
  const tous = [...serie, ...projection];
  if (!serie.length) {
    return null;
  }

  const xMin = Math.min(...tous.map(({ x }) => x));
  const xMax = Math.max(Math.max(...tous.map(({ x }) => x)), xMin + 1);
  let yMin = Math.min(...tous.map(({ valeur }) => valeur));
  let yMax = Math.max(...tous.map(({ valeur }) => valeur));
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }
  const marge = (yMax - yMin) * 0.08;
  yMin -= marge;
  yMax += marge;

  const scaleX = (x: number) =>
    PADDING.left +
    ((x - xMin) / (xMax - xMin)) * (WIDTH - PADDING.left - PADDING.right);
  const scaleY = (valeur: number) =>
    PADDING.top +
    (1 - (valeur - yMin) / (yMax - yMin)) *
      (HEIGHT - PADDING.top - PADDING.bottom);
  const toXY = ({ x, valeur }: Point) => ({ x: scaleX(x), y: scaleY(valeur) });

  const dernier = serie[serie.length - 1];
  const baseline = HEIGHT - PADDING.bottom;
  const ligneResultats = serie.length > 1 ? toPath(serie.map(toXY)) : '';
  const aire =
    serie.length > 1
      ? `${ligneResultats} L${scaleX(dernier.x).toFixed(
          1
        )},${baseline} L${scaleX(serie[0].x).toFixed(1)},${baseline} Z`
      : '';
  // Les pointillés partent du dernier résultat vers les objectifs à venir : un
  // objectif d'une année déjà mesurée garde son point, sans ramener la ligne en
  // arrière.
  const objectifsAVenir = projection.filter(({ x }) => x > dernier.x);
  const ligneProjection = objectifsAVenir.length
    ? toPath([dernier, ...objectifsAVenir].map(toXY))
    : '';

  // Les années de l'axe : l'objectif retenu d'abord, puis le premier et le
  // dernier résultat s'il reste de la place.
  const ticks: { x: number; annee: number; isCible: boolean }[] = [];
  const addTick = (annee: number, isCible: boolean) => {
    const x = scaleX(annee);
    if (ticks.every((tick) => Math.abs(tick.x - x) >= MIN_TICK_GAP)) {
      ticks.push({ x, annee, isCible });
    }
  };
  if (cible) {
    addTick(cible.annee, true);
  }
  addTick(Math.floor(serie[0].x), false);
  addTick(Math.floor(dernier.x), false);

  const cibleXY = cible ? toXY({ x: cible.annee, valeur: cible.valeur }) : null;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={cn(
        'w-full h-auto',
        isOpenData ? 'text-info-1' : 'text-primary-9'
      )}
      aria-hidden
    >
      {aire && <path d={aire} fill="currentColor" fillOpacity={0.08} />}
      {ligneResultats && (
        <path
          d={ligneResultats}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        />
      )}
      {ligneProjection && (
        <path
          d={ligneProjection}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
      )}
      {serie.map((point, index) => {
        const { x, y } = toXY(point);
        return (
          <circle key={`r-${index}`} cx={x} cy={y} r={3} fill="currentColor" />
        );
      })}
      {projection.map((point, index) => {
        const { x, y } = toXY(point);
        return (
          <circle
            key={`o-${index}`}
            cx={x}
            cy={y}
            r={3.5}
            className="fill-white"
            stroke="currentColor"
            strokeWidth={1.5}
          />
        );
      })}
      {cible && cibleXY && (
        <text
          x={cibleXY.x}
          y={cibleXY.y > HEIGHT / 2 ? cibleXY.y - 8 : cibleXY.y + 16}
          textAnchor="middle"
          className="fill-current text-[10px] font-bold"
        >
          {formatValeur(cible.valeur)}
        </text>
      )}
      {ticks.map(({ x, annee, isCible }) => (
        <text
          key={annee}
          x={x}
          y={HEIGHT - 6}
          textAnchor={x < PADDING.left + EDGE_LABEL_ZONE ? 'start' : 'middle'}
          dx={x < PADDING.left + EDGE_LABEL_ZONE ? -PADDING.left : 0}
          className={cn(
            'text-[10px]',
            isCible ? 'fill-primary-9 font-bold' : 'fill-grey-8'
          )}
        >
          {annee}
        </text>
      ))}
    </svg>
  );
};
