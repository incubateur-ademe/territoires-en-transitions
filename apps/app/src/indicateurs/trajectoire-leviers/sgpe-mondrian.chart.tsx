import { appLabels } from '@/app/labels/catalog';
import DownloadCanvasButton from '@/app/ui/buttons/DownloadCanvasButton';
import { CHART_FONT_FAMILY } from '@/app/ui/charts/echarts/constants';
import { ErrorCard } from '@/app/utils/error/error.card';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { cn } from '@tet/ui/utils/cn';
import { MondrianTreemap, type MondrianProps } from 'mondrian-treemap';
import {
  type CSSProperties,
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  fitMondrianLabel,
  getMondrianLevierKey,
  MONDRIAN_LABEL_GAP,
  MONDRIAN_LABEL_PADDING,
  MONDRIAN_REFERENCE_SIZE,
  placeMondrianReferences,
} from './mondrian-label-layout.utils';
import { useMondrianLabelLayout } from './use-mondrian-label-layout';

const CHART_HEIGHT = 700;
const chartStyle = { height: `${CHART_HEIGHT}px` };
const hiddenControl = { show: false };
const MemoMondrian = memo(MondrianTreemap);
const displayError = (error: string) => (
  <ErrorCard title={appLabels.donneesNonDisponibles} subTitle={error} />
);

type Props = Pick<
  MondrianProps,
  'inputData' | 'selectedSecteur' | 'selectedLevier' | 'onSelected'
>;

export function SgpeMondrianChart(props: Props) {
  const externalSecteur = props.selectedSecteur || undefined;
  const externalLevier = props.selectedLevier || undefined;
  const [selection, setSelection] = useState({
    sourceSecteur: externalSecteur,
    sourceLevier: externalLevier,
    selectedSecteur: externalSecteur,
    selectedLevier: externalLevier,
  });
  // Les filtres externes réinitialisent la sélection, comme dans le package.
  if (
    selection.sourceSecteur !== externalSecteur ||
    selection.sourceLevier !== externalLevier
  ) {
    setSelection({
      sourceSecteur: externalSecteur,
      sourceLevier: externalLevier,
      selectedSecteur: externalSecteur,
      selectedLevier: externalLevier,
    });
  }
  const { onSelected } = props;
  const handleSelected = useCallback(
    (secteur: string, levier: string) => {
      const selectedSecteur = secteur || undefined;
      const selectedLevier = levier || undefined;
      setSelection((current) =>
        current.selectedSecteur === selectedSecteur &&
        current.selectedLevier === selectedLevier
          ? current
          : {
              ...current,
              selectedSecteur,
              selectedLevier,
            }
      );
      onSelected?.(secteur, levier);
    },
    [onSelected]
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const legendId = useId();
  const [activeKey, setActiveKey] = useState<string>();
  const [measureContext, setMeasureContext] =
    useState<CanvasRenderingContext2D | null>(null);
  const { treemapOptions, tiles } = useMondrianLabelLayout({
    inputData: props.inputData,
    ...selection,
  });

  useEffect(() => {
    let cancelled = false;
    // Charge aussi la graisse 600 avant de décider si le texte tient.
    Promise.allSettled([
      document.fonts.load(`600 16px ${CHART_FONT_FAMILY}`),
      document.fonts.load(`400 14px ${CHART_FONT_FAMILY}`),
    ]).then(() => {
      if (!cancelled)
        setMeasureContext(document.createElement('canvas').getContext('2d'));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const references = useMemo(
    () =>
      new Map(
        props.inputData.secteurs
          .flatMap((secteur) =>
            secteur.leviers.map((levier) =>
              getMondrianLevierKey(secteur.nom, levier.nom)
            )
          )
          .map((key, index) => [key, index + 1])
      ),
    [props.inputData]
  );

  const labels = useMemo(() => {
    if (!measureContext) return [];
    return tiles.map((tile) => ({
      ...tile,
      reference: references.get(tile.key),
      valueLabel: toLocaleFixed(tile.value),
      fit: fitMondrianLabel(
        tile.levier,
        appLabels.trajectoireLeviersMondrianValeur(toLocaleFixed(tile.value)),
        tile.rect,
        (text, fontSize, weight) => {
          measureContext.font = `${weight} ${fontSize}px ${CHART_FONT_FAMILY}`;
          return measureContext.measureText(text).width;
        }
      ),
    }));
  }, [measureContext, references, tiles]);

  const legend = labels
    .filter((tile) => !tile.fit)
    .sort((a, b) => (a.reference ?? 0) - (b.reference ?? 0));
  const needsCallout = (tile: (typeof labels)[number]) =>
    !tile.fit &&
    (tile.rect.width < MONDRIAN_REFERENCE_SIZE + 4 ||
      tile.rect.height < MONDRIAN_REFERENCE_SIZE + 4);
  const width = Math.max(0, ...tiles.map(({ rect }) => rect.x + rect.width));
  const callouts = placeMondrianReferences(labels.filter(needsCallout), width);
  const calloutHeight = callouts.length
    ? ((callouts.at(-1)?.row ?? 0) + 1) * 36 + 8
    : 0;
  const calloutByKey = new Map(
    callouts.map((callout) => [callout.key, callout])
  );
  const selectedKey = getMondrianLevierKey(
    selection.selectedSecteur ?? '',
    selection.selectedLevier ?? ''
  );

  return (
    <div
      ref={containerRef}
      className="bg-white text-primary-9"
      data-test="indicateurs.trajectoires.leviers.mondrian"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="mb-0 text-base">
          {appLabels.trajectoireLeviersMondrianTitre}
        </h3>
        <div data-html2canvas-ignore className="shrink-0">
          <DownloadCanvasButton
            type="button"
            containerRef={containerRef}
            fileName="trajectoire-leviers-mondrian"
            fileType="png"
            title={appLabels.telechargerLeGraphiquePng}
            aria-label={appLabels.telechargerLeGraphiquePng}
            disabled={!measureContext || !tiles.length}
            data-test="indicateurs.trajectoires.leviers.export"
          />
        </div>
      </div>
      <div
        className="relative"
        style={
          { '--mondrian-callout-height': `${calloutHeight}px` } as CSSProperties
        }
      >
        <MemoMondrian
          {...props}
          selectedSecteur={selection.selectedSecteur}
          selectedLevier={selection.selectedLevier}
          onSelected={handleSelected}
          className="!min-w-0 [&_.mondrian-breadcrumb-container]:top-0 [&_.mondrian-breadcrumb]:max-w-full [&_.mondrian-breadcrumb]:overflow-x-auto [&_.mondrian-legend]:flex-wrap [&_.mondrian-legend]:gap-y-2 [&_.mondrian-legend]:pt-[var(--mondrian-callout-height)]"
          style={chartStyle}
          titleOptions={hiddenControl}
          toolboxOptions={hiddenControl}
          treemapOptions={treemapOptions}
          displayErrorModal={displayError}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{ height: CHART_HEIGHT + calloutHeight }}
        >
          {callouts.length > 0 && (
            <svg
              className="absolute inset-0 h-full w-full overflow-visible"
              aria-hidden="true"
            >
              {callouts.map((tile) => (
                <path
                  key={tile.key}
                  d={`M ${tile.rect.x + tile.rect.width / 2} ${
                    tile.rect.y + tile.rect.height / 2
                  } V ${CHART_HEIGHT + 4} L ${tile.x} ${
                    CHART_HEIGHT + 20 + tile.row * 36
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={activeKey === tile.key ? 2 : 1}
                  opacity={activeKey === tile.key ? 1 : 0.45}
                />
              ))}
            </svg>
          )}
          {labels.map((tile) => {
            const callout = calloutByKey.get(tile.key);
            const highlighted =
              activeKey === tile.key || selectedKey === tile.key;
            return (
              <div key={tile.key}>
                <div
                  className={cn(
                    'absolute',
                    highlighted && 'ring-2 ring-inset ring-primary-9'
                  )}
                  style={{
                    left: tile.rect.x,
                    top: tile.rect.y,
                    width: tile.rect.width,
                    height: tile.rect.height,
                  }}
                  data-test="indicateurs.trajectoires.leviers.tile"
                  data-levier={tile.key}
                >
                  {tile.fit && (
                    <div
                      className="text-primary-9"
                      style={{ padding: MONDRIAN_LABEL_PADDING }}
                    >
                      <div
                        className="font-semibold"
                        data-test="indicateurs.trajectoires.leviers.tile-label"
                        style={{
                          fontSize: tile.fit.labelSize,
                          lineHeight: `${tile.fit.labelLineHeight}px`,
                        }}
                      >
                        {tile.fit.lines.map((line, index) => (
                          <div key={index} className="whitespace-nowrap">
                            {line}
                          </div>
                        ))}
                      </div>
                      <div
                        className="whitespace-nowrap font-normal"
                        data-test="indicateurs.trajectoires.leviers.tile-value"
                        style={{
                          marginTop: MONDRIAN_LABEL_GAP,
                          fontSize: tile.fit.valueSize,
                          lineHeight: `${tile.fit.valueLineHeight}px`,
                        }}
                      >
                        {appLabels.trajectoireLeviersMondrianValeur(
                          tile.valueLabel
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {!tile.fit && (
                  <button
                    type="button"
                    className="pointer-events-auto absolute flex items-center justify-center rounded-full border border-primary-9 bg-white text-xs font-semibold text-primary-9 hover:ring-2 hover:ring-primary-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                      width: MONDRIAN_REFERENCE_SIZE,
                      height: MONDRIAN_REFERENCE_SIZE,
                      left:
                        (callout?.x ?? tile.rect.x + tile.rect.width / 2) -
                        MONDRIAN_REFERENCE_SIZE / 2,
                      top: callout
                        ? CHART_HEIGHT + 8 + callout.row * 36
                        : tile.rect.y +
                          (tile.rect.height - MONDRIAN_REFERENCE_SIZE) / 2,
                    }}
                    aria-label={appLabels.trajectoireLeviersMondrianRepere(
                      tile.reference ?? 0,
                      tile.levier,
                      tile.valueLabel
                    )}
                    aria-describedby={`${legendId}-${tile.reference}`}
                    onMouseEnter={() => setActiveKey(tile.key)}
                    onMouseLeave={() => setActiveKey(undefined)}
                    onFocus={() => setActiveKey(tile.key)}
                    onBlur={() => setActiveKey(undefined)}
                    onClick={() => handleSelected(tile.secteur, tile.levier)}
                    data-test="indicateurs.trajectoires.leviers.repere"
                    data-reference={tile.reference}
                  >
                    {tile.reference}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {legend.length > 0 && (
        <div
          className="mt-4"
          role="group"
          aria-labelledby={legendId}
          data-test="indicateurs.trajectoires.leviers.legend"
        >
          <div id={legendId} className="mb-1 text-xs font-semibold text-grey-7">
            {appLabels.trajectoireLeviersMondrianReperes}
          </div>
          <ul className="m-0 grid list-none gap-x-4 p-0 [grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr))]">
            {legend.map((tile) => (
              <li key={tile.key}>
                <button
                  id={`${legendId}-${tile.reference}`}
                  type="button"
                  className={cn(
                    'flex w-full items-start gap-2 rounded px-1 py-0.5 text-left text-[13px] leading-5 text-primary-9 hover:bg-primary-1 focus-visible:outline focus-visible:outline-2 [@media(pointer:coarse)]:min-h-11',
                    activeKey === tile.key && 'bg-primary-1'
                  )}
                  onMouseEnter={() => setActiveKey(tile.key)}
                  onMouseLeave={() => setActiveKey(undefined)}
                  onFocus={() => setActiveKey(tile.key)}
                  onBlur={() => setActiveKey(undefined)}
                  onClick={() => handleSelected(tile.secteur, tile.levier)}
                  data-test="indicateurs.trajectoires.leviers.legend-entry"
                  data-reference={tile.reference}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary-9 text-xs font-semibold"
                    style={{ backgroundColor: tile.color }}
                  >
                    {tile.reference}
                  </span>
                  <span className="min-w-0 break-words">
                    <span className="font-semibold">{tile.levier}</span>{' '}
                    <span className="whitespace-nowrap font-normal">{`(${tile.valueLabel})`}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
