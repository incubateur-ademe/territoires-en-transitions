import styles from '@/site/components/animated-demo/animated-demo.module.css';
import { Confetti } from '@/site/components/animated-demo/confetti';
import { DemoCursor } from '@/site/components/animated-demo/demo-cursor';
import { getCurrentKeyframe } from '@/site/components/animated-demo/timeline';
import { TerritoiresEnTransitionsLogo } from '@tet/ui';
import classNames from 'classnames';
import { ReactNode } from 'react';
import {
  AdoptedBanner,
  AvisDownloadButton,
  Check,
  Checkbox,
  CompletionBadge,
  DocumentTypeBadge,
  DocumentUpload,
  Envelope,
  EtapeBullet,
  FakeButton,
  ImportSplitButton,
  NiveauVulnerabilite,
  PdfIcon,
  Toggle,
} from './depot-demo.elements';
import {
  COMPACT_DOCUMENT_CARDS,
  CURSOR,
  DELIBERATION_ADOPTION,
  DIAGNOSTIC_YEARS,
  PROGRAMME_IMPORT,
  VULNERABILITE,
} from './depot-demo.scenario';
import { DepotDemoState } from './depot-demo.state';

export const COMPACT_SCENE = { width: 360, height: 580 };

/** Seules la première et la dernière colonne tiennent sur un écran de mobile. */
const VISIBLE_YEARS = [0, DIAGNOSTIC_YEARS.length - 1];
const VISIBLE_HORIZONS = [0, VULNERABILITE.horizons.length - 1];
const INDICATEURS_GRID = 'grid grid-cols-[minmax(0,1fr)_62px_62px]';
const VULNERABILITE_GRID = 'grid grid-cols-[minmax(0,1fr)_96px_96px]';

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
    <h3 className="m-0 text-base font-bold leading-snug text-primary-9">
      {title}
    </h3>
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

const DiagnosticScreen = ({ state }: ScreenProps) => (
  <Screen title="Diagnostic et stratégie">
    <div className="grid grid-cols-3 gap-1.5">
      {state.volets.map((volet) => (
        <div
          key={volet.name}
          className={classNames(
            'flex flex-col items-center justify-between h-[46px] px-1 py-1 text-center bg-white rounded-md',
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
          <CompletionBadge statut={volet.status} size="xs" withIcon={false} />
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
        {activeVolet.tableTitle ?? activeVolet.shortName} ({activeVolet.unit})
      </span>
      {VISIBLE_YEARS.map((index) => (
        <span key={index} className="px-2">
          {DIAGNOSTIC_YEARS[index]}
        </span>
      ))}
    </div>
    {rows.map((row) => (
      <div
        key={row.label}
        className={classNames(
          INDICATEURS_GRID,
          'items-center h-6 text-[11px] border-t border-primary-1'
        )}
      >
        <span className="flex items-center justify-between gap-1.5 px-2.5 overflow-hidden whitespace-nowrap">
          <span className="truncate">{row.label}</span>
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
          'items-center h-[22px] text-[11px] border-t border-primary-1 [&>span]:px-2'
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

const DocumentsScreen = ({ state }: ScreenProps) => {
  const { otherRequired } = state;
  const allDone = otherRequired.done === otherRequired.total;
  return (
    <Screen title="Ajouter les documents attendus">
      {state.documents
        .filter(({ name }) => COMPACT_DOCUMENT_CARDS.includes(name))
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
            <DocumentUpload
              phase={document.phase}
              progress={document.progress}
              file={document.upload?.file ?? ''}
              size="xs"
            />
          </Card>
        ))}
      {state.documents
        .filter(({ inclusion }) => inclusion)
        .map((document) => (
          <Card
            key={document.name}
            className="flex flex-col gap-2 px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-bold text-primary-9 line-clamp-1">
                {document.name}
              </span>
              <DocumentTypeBadge required={document.required} size="xs" />
            </div>
            {document.isInclusionDeclarable ? (
              <span className="flex items-center gap-2 text-[11px] leading-snug text-primary-9">
                <Checkbox checked={document.isIncluded} className="size-4" />
                Inclus dans le diagnostic, la stratégie et/ou le programme
              </span>
            ) : (
              <DocumentUpload phase="empty" progress={0} file="" size="xs" />
            )}
          </Card>
        ))}
      <Card className="flex items-center justify-between gap-2 px-3 py-2.5">
        <span className="flex flex-col">
          <span className="text-[13px] font-bold text-primary-9">
            Autres pièces obligatoires
          </span>
          <span className="text-[11px] text-grey-8">
            Suivi-évaluation, EES, délibération d&apos;arrêt
          </span>
        </span>
        <span
          className={classNames(
            'flex items-center gap-1.5 text-[13px] font-bold tabular-nums',
            allDone ? 'text-success-1' : 'text-primary-9'
          )}
        >
          {otherRequired.done}/{otherRequired.total}
          {allDone && <Check className="size-4" />}
        </span>
      </Card>
    </Screen>
  );
};

const ProgrammeScreen = ({ state }: ScreenProps) => {
  const { programme } = state;
  return (
    <Screen title="Programme d'actions détaillé">
      <ImportSplitButton
        variant={programme.hasPlan ? 'secondary' : 'primary'}
        isLoading={programme.importPhase === 'loading'}
        className="h-10"
      />
      {programme.hasPlan ? (
        <Card className={classNames('flex flex-col gap-2 p-3', styles.slideIn)}>
          <span className="flex flex-col gap-0.5">
            <span className="text-[13px] font-bold text-primary-9">
              {programme.planName}
            </span>
            {programme.importPhase === 'done' && (
              <span className="text-[11px] text-grey-8">
                Généré depuis votre PDF
              </span>
            )}
          </span>
          <span className="text-xs text-grey-8 tabular-nums">
            {programme.importPhase === 'loading'
              ? 'Import en cours…'
              : `${programme.actionCount} actions`}
          </span>
        </Card>
      ) : (
        <Card className="flex items-center justify-center min-h-[52px] px-3 py-3.5 text-center text-xs text-grey-8">
          {programme.importPhase === 'flying' ? (
            <span
              className={classNames(
                'flex items-center gap-1.5 px-2 py-1 bg-white border border-primary-3 rounded-md shadow-[0_8px_18px_rgba(64,64,146,0.2)] text-[11px] font-medium text-primary-10',
                styles.fly
              )}
            >
              <PdfIcon className="w-3 h-[15px] text-[4px]" />
              {PROGRAMME_IMPORT.file}
            </span>
          ) : (
            'Aucun plan de type PCAET pour cette collectivité.'
          )}
        </Card>
      )}
    </Screen>
  );
};

const AvisScreen = ({ state }: ScreenProps) => {
  const { avis } = state;
  return (
    <Screen title={avis.title}>
      <p className="m-0 text-xs text-grey-8 line-clamp-2">{avis.subtitle}</p>
      <Card className="relative flex-none h-[110px] overflow-hidden rounded-[10px]">
        {avis.mailArrived && (
          <Envelope
            isOpen={avis.mailOpened}
            report={avis.outgoingReport?.report}
            compact
          />
        )}
      </Card>
      {avis.received.map((unAvis) =>
        unAvis.isReceived ? (
          <Card
            key={unAvis.auTitreDe}
            className={classNames(
              'flex flex-none items-center gap-2.5 h-11 px-3 bg-grey-1 border-grey-3',
              styles.slideIn
            )}
          >
            <span className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-bold text-primary-9 truncate">
                {unAvis.auTitreDe}
              </span>
              <span className="text-[10px] text-grey-8">
                Avis rendu le {unAvis.renduLe}
              </span>
            </span>
            <AvisDownloadButton size="xs" />
          </Card>
        ) : (
          <div
            key={unAvis.auTitreDe}
            className="flex flex-none items-center h-11 px-3 text-xs text-grey-8 border border-dashed border-primary-4 rounded-lg"
          >
            En attente de l&apos;avis {unAvis.emitter}…
          </div>
        )
      )}
      {avis.showAdoptionPieces && !avis.isAdopted && (
        <Card
          className={classNames(
            'flex flex-none items-center gap-2 h-12 px-3',
            styles.fade
          )}
        >
          <span className="flex-1 text-xs font-bold leading-tight text-primary-9">
            {DELIBERATION_ADOPTION.name}
          </span>
          <DocumentUpload
            phase={avis.deliberation.phase}
            progress={avis.deliberation.progress}
            file={DELIBERATION_ADOPTION.file}
            size="xs"
          />
        </Card>
      )}
      {avis.isAdopted && <AdoptedBanner compact />}
    </Screen>
  );
};

const COMPACT_SCREENS = {
  diagnostic: DiagnosticScreen,
  documents: DocumentsScreen,
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
                  etape.status === 'done' ? 'bg-primary-7' : 'bg-grey-3'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
    <div className="flex items-center justify-between gap-2">
      <span className="text-[13px] font-bold text-primary-9 truncate">
        {state.currentEtape.title}
      </span>
      {state.isElaborating && (
        <div className="flex flex-none gap-1">
          {state.subSteps.map((subStep) => (
            <span
              key={subStep.shortTitle}
              className={classNames(
                'px-1.5 py-0.5 rounded-lg border text-[9px] font-bold transition-colors duration-200',
                subStep.status === 'complete'
                  ? 'border-success-1 bg-success-1 text-white'
                  : subStep.isCurrent
                  ? 'border-primary-7 bg-primary-0 text-primary-9'
                  : 'border-grey-3 bg-white text-primary-9'
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
