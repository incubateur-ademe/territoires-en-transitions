import {
  IndicateurObjectifHorizon,
  IndicateurResultat,
  IndicateurValeurAnnee,
} from '@tet/domain/plans';
import { cn } from '@tet/ui/utils/cn';
import { PointerEvent, useRef, useState } from 'react';

const WIDTH = 320;
const HEIGHT = 120;
// la marge gauche loge la pastille de la valeur survolée
const PADDING = { left: 30, right: 28, top: 16, bottom: 22 };
const MIN_TICK_GAP = 32;
// Une année au bord gauche s'y aligne au lieu d'être centrée et rognée.
const EDGE_LABEL_ZONE = 12;

type Point = { x: number; valeur: number };

type TickKind = 'cible' | 'depart' | 'resultat';

const TICK_CLASSNAMES: Record<TickKind, string> = {
  cible: 'fill-primary-9 font-bold',
  depart: 'fill-new-1 font-bold',
  resultat: 'fill-grey-8',
};

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
 * celle du texte : primaire, ou info pour une donnée open data. Le point de
 * départ du chemin parcouru ressort dans une autre couleur, avec son année.
 */
export const IndicateurObjectifSparkline = ({
  resultats,
  objectifs,
  cible,
  depart = null,
  isOpenData,
  formatValeur,
  libelleSerie,
}: {
  resultats: IndicateurResultat[];
  objectifs: IndicateurObjectifHorizon[];
  cible: IndicateurObjectifHorizon | null;
  depart?: IndicateurValeurAnnee | null;
  isOpenData: boolean;
  formatValeur: (valeur: number) => string;
  /** Le nom de la série dans l'infobulle du survol */
  libelleSerie: string;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [survolIndex, setSurvolIndex] = useState<number | null>(null);

  const serie: Point[] = resultats.map(({ dateValeur, valeur }) => ({
    x: toAnnee(dateValeur),
    valeur,
  }));
  const projection: Point[] = objectifs.map(({ annee, valeur }) => ({
    x: annee,
    valeur,
  }));
  // Le départ est un point de la série, ou celui du dépôt PCAET s'il n'en est
  // pas un (année de référence absente des résultats de la collectivité).
  const departPoint: Point | null = depart
    ? serie.find(
        ({ x, valeur }) =>
          Math.floor(x) === depart.annee && valeur === depart.valeur
      ) ?? { x: depart.annee, valeur: depart.valeur }
    : null;
  const tous = [...serie, ...projection, ...(departPoint ? [departPoint] : [])];
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

  // Les années de l'axe : l'objectif retenu d'abord, puis le départ, le premier
  // et le dernier résultat s'il reste de la place. Un repère se place sur son point
  // et seul son libellé est arrondi à l'année : un résultat d'octobre placé au
  // 1er janvier sortirait du dessin.
  const ticks: { x: number; annee: number; kind: TickKind }[] = [];
  const addTick = (position: number, kind: TickKind) => {
    const x = scaleX(position);
    if (ticks.every((tick) => Math.abs(tick.x - x) >= MIN_TICK_GAP)) {
      ticks.push({ x, annee: Math.floor(position), kind });
    }
  };
  if (cible) {
    addTick(cible.annee, 'cible');
  }
  if (departPoint) {
    addTick(departPoint.x, 'depart');
  }
  addTick(serie[0].x, 'resultat');
  addTick(dernier.x, 'resultat');

  const cibleXY = cible ? toXY({ x: cible.annee, valeur: cible.valeur }) : null;
  const departXY = departPoint ? toXY(departPoint) : null;

  // le point de la série le plus proche du curseur, en coordonnées du dessin
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) {
      return;
    }
    const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
    let plusProche = 0;
    serie.forEach((point, index) => {
      if (
        Math.abs(scaleX(point.x) - x) <
        Math.abs(scaleX(serie[plusProche].x) - x)
      ) {
        plusProche = index;
      }
    });
    setSurvolIndex(plusProche);
  };

  const survol = survolIndex !== null ? serie[survolIndex] : null;
  const survolXY = survol ? toXY(survol) : null;
  const survolAnnee = survol ? Math.floor(survol.x) : null;
  const survolValeur = survol ? formatValeur(survol.valeur) : null;
  const premierXY = toXY(serie[0]);
  // la valeur du premier point passe sous lui si elle sortirait du dessin
  const premierValeurY =
    premierXY.y - 7 > 8 ? premierXY.y - 7 : premierXY.y + 14;

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={cn(
          'w-full h-auto',
          isOpenData ? 'text-info-1' : 'text-primary-9'
        )}
        aria-hidden
        onPointerMove={onPointerMove}
        onPointerLeave={() => setSurvolIndex(null)}
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
            <circle
              key={`r-${index}`}
              cx={x}
              cy={y}
              r={3}
              fill="currentColor"
            />
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
        {departXY && (
          <circle
            cx={departXY.x}
            cy={departXY.y}
            r={4}
            className="fill-new-1 stroke-white"
            strokeWidth={1.5}
            data-test="plans.suivi.indicateurs-objectifs.depart"
          />
        )}
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
        <text
          x={premierXY.x}
          y={premierValeurY}
          textAnchor="middle"
          className="fill-current text-[10px] font-bold"
          data-test="plans.suivi.indicateurs-objectifs.valeur-depart"
        >
          {formatValeur(serie[0].valeur)}
        </text>
        {ticks.map(({ x, annee, kind }) => (
          <text
            key={x}
            x={x}
            y={HEIGHT - 6}
            textAnchor={x < PADDING.left + EDGE_LABEL_ZONE ? 'start' : 'middle'}
            dx={x < PADDING.left + EDGE_LABEL_ZONE ? -PADDING.left : 0}
            className={cn('text-[10px]', TICK_CLASSNAMES[kind])}
          >
            {annee}
          </text>
        ))}
        {survolXY && survolAnnee !== null && survolValeur !== null && (
          <g data-test="plans.suivi.indicateurs-objectifs.survol">
            <line
              x1={survolXY.x}
              x2={survolXY.x}
              y1={PADDING.top}
              y2={HEIGHT - PADDING.bottom}
              stroke="currentColor"
              strokeOpacity={0.5}
              strokeDasharray="3 3"
            />
            <line
              x1={PADDING.left}
              x2={survolXY.x}
              y1={survolXY.y}
              y2={survolXY.y}
              stroke="currentColor"
              strokeOpacity={0.5}
              strokeDasharray="3 3"
            />
            <circle
              cx={survolXY.x}
              cy={survolXY.y}
              r={4.5}
              className="fill-white"
              stroke="currentColor"
              strokeWidth={2}
            />
            <rect
              x={Math.max(0, PADDING.left - 4 - (survolValeur.length * 6 + 8))}
              y={survolXY.y - 7}
              width={survolValeur.length * 6 + 8}
              height={14}
              rx={3}
              className="fill-grey-8"
            />
            <text
              x={
                Math.max(0, PADDING.left - 4 - (survolValeur.length * 6 + 8)) +
                (survolValeur.length * 6 + 8) / 2
              }
              y={survolXY.y + 3}
              textAnchor="middle"
              className="fill-white text-[10px] font-bold"
            >
              {survolValeur}
            </text>
            <rect
              x={survolXY.x - 17}
              y={HEIGHT - 19}
              width={34}
              height={15}
              rx={3}
              className="fill-grey-8"
            />
            <text
              x={survolXY.x}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="fill-white text-[10px] font-bold"
            >
              {survolAnnee}
            </text>
          </g>
        )}
      </svg>
      {survolXY && survolAnnee !== null && survolValeur !== null && (
        <div
          className="pointer-events-none absolute top-0 flex flex-col gap-0.5 rounded border border-grey-3 bg-white px-2 py-1.5 text-xs shadow-md whitespace-nowrap"
          style={{
            left: `${(survolXY.x / WIDTH) * 100}%`,
            transform:
              survolXY.x / WIDTH > 0.55
                ? 'translateX(calc(-100% - 10px))'
                : 'translateX(10px)',
          }}
        >
          <span className="font-bold text-primary-9">{survolAnnee}</span>
          <span className="flex items-center gap-1.5 text-grey-8">
            <span
              className="inline-block size-2 rounded-full bg-current"
              aria-hidden
            />
            {libelleSerie}
            <b className="text-primary-9">{survolValeur}</b>
          </span>
        </div>
      )}
      <ul
        className="sr-only"
        data-test="plans.suivi.indicateurs-objectifs.resultats-texte"
      >
        {serie.map((point) => (
          <li key={point.x}>
            {`${Math.floor(point.x)} : ${libelleSerie} ${formatValeur(
              point.valeur
            )}`}
          </li>
        ))}
      </ul>
    </div>
  );
};
