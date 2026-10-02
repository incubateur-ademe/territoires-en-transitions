import styles from '@/site/components/animated-demo/animated-demo.module.css';
import { Confetti } from '@/site/components/animated-demo/confetti';
import { DemoCursor } from '@/site/components/animated-demo/demo-cursor';
import { getCurrentKeyframe } from '@/site/components/animated-demo/timeline';
import { TerritoiresEnTransitionsLogo } from '@tet/ui';
import classNames from 'classnames';
import { ReactNode } from 'react';
import {
  AdoptedBanner,
  Check,
  DocumentTypeBadge,
  Envelope,
  EtapeBullet,
  FakeButton,
  ImportDropzone,
  NiveauVulnerabilite,
  PdfIcon,
  PlanVerification,
  ReceivedBadge,
  Toggle,
  VoletStatusBadge,
} from './depot-demo.elements';
import { CURSOR, DIAGNOSTIC_YEARS, VULNERABILITE } from './depot-demo.scenario';
import { DepotDemoState } from './depot-demo.state';

export const COMPACT_SCENE = { width: 360, height: 580 };

/** Seules la première et la dernière colonne tiennent sur un écran de mobile. */
const VISIBLE_YEARS = [0, DIAGNOSTIC_YEARS.length - 1];
const VISIBLE_HORIZONS = [0, VULNERABILITE.horizons.length - 1];
const INDICATEURS_GRID = 'grid grid-cols-[minmax(0,1fr)_62px_62px]';
const VULNERABILITE_GRID = 'grid grid-cols-[minmax(0,1fr)_88px_88px]';

type ScreenProps = { state: DepotDemoState };

const Screen = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div
    className={classNames(
      'absolute inset-0 flex flex-col gap-2.5 p-3.5',
      styles.fade
    )}
  >
    <h3 className="m-0 text-base font-bold text-primary-9">{title}</h3>
    {children}
  </div>
);

const Card = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <div
    className={classNames(
      'bg-white border border-primary-3 rounded-lg',
      className
    )}
  >
    {children}
  </div>
);

const DocumentsScreen = ({ state }: ScreenProps) => {
  const allIncluded = state.inclusions.done === state.inclusions.total;
  return (
    <Screen title="Ajouter les documents attendus">
      {state.documents
        .filter(({ upload }) => upload)
        .map((document) => (
          <Card
            key={document.name}
            className="flex flex-col gap-2 min-h-[62px] px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-bold text-primary-9 line-clamp-1">
                {document.name}
              </span>
              <DocumentTypeBadge required={document.required} size="xs" />
            </div>
            {document.phase === 'empty' && (
              <span className="self-start px-2 py-[3px] border border-primary-9 rounded text-[11px] font-bold text-primary-9">
                + Déposer un document
              </span>
            )}
            {document.phase === 'flying' && (
              <span
                className={classNames(
                  'self-start flex items-center gap-1.5 px-2 py-[3px] bg-white border border-primary-3 rounded-md shadow-[0_8px_18px_rgba(64,64,146,0.2)] text-[11px]',
                  styles.fly
                )}
              >
                <PdfIcon className="w-3 h-[15px] text-[4px]" />
                {document.upload?.file}
              </span>
            )}
            {document.phase === 'uploading' && (
              <span className="flex h-1 overflow-hidden rounded-sm bg-primary-2">
                <span
                  className="h-full bg-primary-7"
                  style={{ width: `${document.progress * 100}%` }}
                />
              </span>
            )}
            {document.phase === 'uploaded' && (
              <span className="flex items-center gap-1.5 text-xs text-primary-9">
                <Check className="size-[13px]" />
                <span className="underline">{document.upload?.file}</span>
              </span>
            )}
          </Card>
        ))}
      <Card className="flex items-center justify-between gap-2 px-3 py-2.5">
        <span className="flex flex-col">
          <span className="text-[13px] font-bold text-primary-9">
            Pièces obligatoires
          </span>
          <span className="text-[11px] text-grey-8">
            Incluses dans « PCAET global »
          </span>
        </span>
        <span
          className={classNames(
            'flex items-center gap-1.5 text-[13px] font-bold tabular-nums',
            allIncluded ? 'text-success-1' : 'text-primary-9'
          )}
        >
          {state.inclusions.done}/{state.inclusions.total}
          {allIncluded && <Check className="size-4" />}
        </span>
      </Card>
    </Screen>
  );
};

const DiagnosticScreen = ({ state }: ScreenProps) => (
  <Screen title="Diagnostic et objectifs">
    <div className="grid grid-cols-3 gap-1.5">
      {state.volets.map((volet) => (
        <div
          key={volet.name}
          className={classNames(
            'flex flex-col items-center justify-between h-[52px] px-1 py-[5px] text-center bg-white rounded-md',
            volet.isActive
              ? 'border-2 border-primary-9'
              : 'border border-primary-3'
          )}
        >
          <span
            className={classNames(
              'text-[10px] leading-tight text-primary-9',
              volet.isActive ? 'font-bold' : 'font-medium'
            )}
          >
            {volet.shortName}
          </span>
          <VoletStatusBadge status={volet.status} size="xs" />
        </div>
      ))}
    </div>
    {state.vulnerabilite ? (
      <VulnerabiliteTable thematiques={state.vulnerabilite} />
    ) : (
      <IndicateursTable activeVolet={state.activeVolet} rows={state.rows} />
    )}
  </Screen>
);

const IndicateursTable = ({
  activeVolet,
  rows,
}: Pick<DepotDemoState, 'activeVolet' | 'rows'>) => (
  <Card className="overflow-hidden">
    <div
      className={classNames(
        INDICATEURS_GRID,
        'items-center h-7 text-[11px] font-bold border-b border-primary-2'
      )}
    >
      <span className="px-2.5 truncate text-primary-9">
        {activeVolet.shortName} ({activeVolet.unit})
      </span>
      {VISIBLE_YEARS.map((index) => (
        <span key={index} className="px-2">
          {DIAGNOSTIC_YEARS[index]}
        </span>
      ))}
    </div>
    {rows.map((row) => (
      <div
        key={row.sector}
        className={classNames(
          INDICATEURS_GRID,
          'items-center h-6 text-[11px] border-t border-primary-1'
        )}
      >
        <span className="flex items-center justify-between gap-1.5 px-2.5 overflow-hidden whitespace-nowrap">
          <span className="truncate">{row.sector}</span>
          <Toggle isOn={row.isActive} className="w-6 h-3.5" />
        </span>
        {VISIBLE_YEARS.map((index) => {
          const cell = row.cells[index];
          return (
            <span
              key={index}
              className={classNames(
                'px-2 tabular-nums',
                cell.isTyping ? 'font-bold text-primary-7' : 'text-primary-10'
              )}
            >
              {cell.text}
            </span>
          );
        })}
      </div>
    ))}
  </Card>
);

const VulnerabiliteTable = ({
  thematiques,
}: {
  thematiques: NonNullable<DepotDemoState['vulnerabilite']>;
}) => (
  <Card className="overflow-hidden">
    <div
      className={classNames(
        VULNERABILITE_GRID,
        'items-center h-7 text-[10px] font-bold tracking-wide border-b border-primary-2 [&>span]:px-2.5'
      )}
    >
      <span className="text-primary-9">THÉMATIQUES</span>
      {VISIBLE_HORIZONS.map((index) => (
        <span key={index}>{VULNERABILITE.horizons[index].toUpperCase()}</span>
      ))}
    </div>
    {thematiques.map((thematique) => (
      <div
        key={thematique.name}
        className={classNames(
          VULNERABILITE_GRID,
          'items-center h-6 text-[11px] border-t border-primary-1 [&>span]:px-2.5'
        )}
      >
        <span className="font-medium text-primary-9 truncate">
          {thematique.name}
        </span>
        {VISIBLE_HORIZONS.map((index) => (
          <span key={index}>
            <NiveauVulnerabilite niveau={thematique.niveaux[index]} size="xs" />
          </span>
        ))}
      </div>
    ))}
  </Card>
);

const ProgrammeScreen = ({ state }: ScreenProps) => (
  <Screen title="Programme d'actions">
    <ImportDropzone phase={state.programme.importPhase} compact />
    {state.programme.isPlanLinked ? (
      <Card className={classNames('flex flex-col gap-2 p-3', styles.slideIn)}>
        <span className="text-[13px] font-bold text-primary-9">
          Programme d&apos;actions – PCAET
        </span>
        <div className="flex items-center justify-between">
          <span className="text-xs text-grey-8 tabular-nums">
            {state.programme.actionCount} actions
          </span>
          <span
            className={classNames(
              'flex items-center gap-1.5 text-[11px] font-bold',
              state.programme.isVerified ? 'text-success-1' : 'text-grey-8'
            )}
          >
            <PlanVerification isVerified={state.programme.isVerified} />
            Plan vérifié
          </span>
        </div>
      </Card>
    ) : (
      <Card className="px-3 py-3.5 text-xs text-grey-8">
        Aucun plan rattaché pour le moment.
      </Card>
    )}
  </Screen>
);

const AvisScreen = ({ state }: ScreenProps) => (
  <Screen title={state.avis.title}>
    <p className="m-0 text-xs text-grey-8">{state.avis.subtitle}</p>
    <Card className="relative flex-none h-[130px] overflow-hidden rounded-[10px]">
      {state.avis.mailArrived && (
        <Envelope
          isOpen={state.avis.mailOpened}
          report={state.avis.outgoingReport?.report}
          compact
        />
      )}
    </Card>
    {state.avis.received.map((avis) =>
      avis.isReceived ? (
        <Card
          key={avis.file}
          className={classNames(
            'flex flex-none items-center gap-2.5 h-12 px-3',
            styles.slideIn
          )}
        >
          <PdfIcon className="w-4 h-5 text-[5px]" />
          <span className="flex-1 text-[13px] font-bold text-primary-9">
            {avis.file}
          </span>
          <ReceivedBadge size="xs" />
        </Card>
      ) : (
        <div
          key={avis.file}
          className="flex flex-none items-center h-12 px-3 text-xs text-grey-8 border border-dashed border-primary-4 rounded-lg"
        >
          En attente de l&apos;avis de {avis.emitter}…
        </div>
      )
    )}
    {state.avis.isAdopted && <AdoptedBanner compact />}
  </Screen>
);

const COMPACT_SCREENS = {
  documents: DocumentsScreen,
  diagnostic: DiagnosticScreen,
  programme: ProgrammeScreen,
  avis: AvisScreen,
};

/** En-tête de la scène mobile : frise des étapes et sous-étapes en cours. */
const ProgressHeader = ({ state }: ScreenProps) => (
  <div className="flex flex-col gap-2 h-[84px] px-3.5 py-2.5 bg-white border-b border-primary-3">
    <div className="flex items-center">
      {state.etapes.map((etape, index) => {
        const isLast = index === state.etapes.length - 1;
        return (
          <div
            key={etape.title}
            className={classNames(
              'flex items-center',
              isLast ? 'flex-none' : 'flex-1'
            )}
          >
            <EtapeBullet
              status={etape.status}
              number={index + 1}
              className="size-[22px] text-[11px]"
            />
            {!isLast && (
              <span
                className={classNames(
                  'flex-1 h-0.5 mx-1.5 transition-colors duration-300',
                  etape.status === 'done' ? 'bg-success-1' : 'bg-primary-3'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
    <div className="flex items-center justify-between gap-2">
      <span className="text-[13px] font-bold text-primary-9">
        {state.currentEtape.title}
      </span>
      {state.isElaborating && (
        <div className="flex gap-1">
          {state.subSteps.map((subStep) => (
            <span
              key={subStep.shortTitle}
              className={classNames(
                'px-1.5 py-0.5 rounded-lg border text-[9px] font-bold transition-colors duration-200',
                subStep.isDone
                  ? 'border-success-1 bg-success-2 text-success-1'
                  : subStep.isCurrent
                  ? 'border-primary-9 bg-primary-2 text-primary-9'
                  : 'border-primary-4 bg-white text-primary-9'
              )}
            >
              {subStep.shortTitle}
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
);

/** Scène mobile : un écran à la fois, sous la frise des étapes. */
export const DepotDemoCompact = ({
  state,
  time,
}: {
  state: DepotDemoState;
  time: number;
}) => {
  const CurrentScreen = COMPACT_SCREENS[state.screen];
  const cursor = getCurrentKeyframe(CURSOR.compact, time);
  const { primaryButton } = state;

  return (
    <div className="relative size-full bg-grey-2 text-[13px] leading-snug text-primary-10">
      <div className="flex items-center gap-2.5 h-9 px-3.5 bg-white border-b border-primary-3">
        <TerritoiresEnTransitionsLogo className="h-6 w-auto" />
        <span className="text-xs text-grey-8">› Démarche PCAET</span>
      </div>
      <ProgressHeader state={state} />

      <div className="absolute left-0 top-[120px] w-[360px] h-[460px]">
        <CurrentScreen key={state.screen} state={state} />
        {primaryButton.visible && (
          <FakeButton
            enabled={primaryButton.enabled}
            pressed={state.isClicking}
            className={classNames(
              'absolute inset-x-3.5 bottom-3.5 h-10 text-sm',
              styles.fade
            )}
          >
            {primaryButton.label} →
          </FakeButton>
        )}
      </div>

      {state.showConfetti && (
        <Confetti x={180} y={300} scale={{ size: 0.8, dx: 0.5, dy: 0.6 }} />
      )}
      <DemoCursor
        x={cursor.x}
        y={cursor.y}
        visible={cursor.visible}
        transition={cursor.transition}
        pressed={state.isClicking}
        variant="touch"
      />
    </div>
  );
};
