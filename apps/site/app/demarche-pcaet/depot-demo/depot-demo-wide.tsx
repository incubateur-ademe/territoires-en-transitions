import styles from '@/site/components/animated-demo/animated-demo.module.css';
import { Confetti } from '@/site/components/animated-demo/confetti';
import { DemoCursor } from '@/site/components/animated-demo/demo-cursor';
import { getCurrentKeyframe } from '@/site/components/animated-demo/timeline';
import { Icon, TerritoiresEnTransitionsLogo } from '@tet/ui';
import classNames from 'classnames';
import { ReactNode } from 'react';
import {
  AdoptedBanner,
  Check,
  Checkbox,
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

export const WIDE_SCENE = { width: 1200, height: 720 };

const DOCUMENTS_GRID = 'grid grid-cols-[120px_minmax(0,1fr)_270px]';
const INDICATEURS_GRID = 'grid grid-cols-[270px_repeat(4,minmax(0,1fr))]';
const VULNERABILITE_GRID =
  'grid grid-cols-[170px_repeat(3,minmax(0,1fr))_170px]';
const PLANS_GRID = 'grid grid-cols-[minmax(0,1fr)_170px_150px]';

/** Longueur finale de chaque objectif « écrit », pour varier les lignes. */
const OBJECTIF_LENGTHS = [85, 70, 95, 75, 90, 65, 80, 72];

type ScreenProps = { state: DepotDemoState };

const Screen = ({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}) => (
  <div
    className={classNames(
      'absolute inset-0 flex flex-col gap-3.5 px-6 py-[22px]',
      styles.fade
    )}
  >
    <div>
      <h3 className="m-0 text-xl font-bold text-primary-9">{title}</h3>
      <p className="m-0 mt-1 text-[13px] text-grey-8">{subtitle}</p>
    </div>
    {children}
    <div className="absolute inset-x-6 bottom-5 flex justify-between min-h-[41px] pt-3 border-t border-primary-3">
      {footer}
    </div>
  </div>
);

const NextButton = ({
  label,
  enabled = true,
  pressed,
}: {
  label: string;
  enabled?: boolean;
  pressed: boolean;
}) => (
  <FakeButton
    enabled={enabled}
    pressed={pressed}
    className="ml-auto px-[18px] py-2.5 text-sm"
  >
    {label} <Icon icon="arrow-right-line" size="sm" />
  </FakeButton>
);

const PreviousButton = () => (
  <FakeButton variant="secondary" className="px-4 py-[9px] text-sm">
    <Icon icon="arrow-left-line" size="sm" /> Étape précédente
  </FakeButton>
);

const DocumentsScreen = ({ state }: ScreenProps) => (
  <Screen
    title="Ajouter les documents attendus"
    subtitle="Déposer les pièces usuelles attendues."
    footer={<NextButton label="Étape suivante" pressed={state.isClicking} />}
  >
    <div className="overflow-hidden bg-white border border-primary-3 rounded-lg">
      <div
        className={classNames(
          DOCUMENTS_GRID,
          'items-center h-[34px] text-[11px] font-bold tracking-wide text-primary-10 [&>span]:px-3.5'
        )}
      >
        <span>TYPE</span>
        <span>NOM DU DOCUMENT</span>
        <span>DOCUMENTS LIÉS</span>
      </div>
      {state.documents.map((document) => (
        <div
          key={document.name}
          className={classNames(
            DOCUMENTS_GRID,
            'min-h-[42px] border-t border-primary-2'
          )}
        >
          <div className="flex items-center px-3.5 border-r border-primary-2">
            <DocumentTypeBadge required={document.required} />
          </div>
          <div className="flex flex-col justify-center gap-0.5 px-3.5 py-1.5">
            <span className="text-[13px] font-medium text-primary-9">
              {document.name}
            </span>
            {document.description && (
              <span className="text-[11px] text-grey-8">
                {document.description}
              </span>
            )}
          </div>
          <div className="flex items-center px-3.5 py-1.5 border-l border-primary-2">
            <DocumentCell document={document} />
          </div>
        </div>
      ))}
    </div>
  </Screen>
);

const DocumentCell = ({
  document,
}: {
  document: DepotDemoState['documents'][number];
}) => {
  if (!document.upload) {
    return (
      <span className="flex items-center gap-2 text-xs text-primary-9">
        <Checkbox checked={document.isIncluded} className="size-4" />
        Inclus dans « PCAET global »
      </span>
    );
  }
  const { file } = document.upload;
  switch (document.phase) {
    case 'empty':
      return (
        <span className="px-2.5 py-1 border border-primary-9 rounded text-xs font-bold text-primary-9">
          + Déposer un document
        </span>
      );
    case 'flying':
      return (
        <span
          className={classNames(
            'flex items-center gap-1.5 px-2 py-1 bg-white border border-primary-3 rounded-md shadow-[0_8px_18px_rgba(64,64,146,0.2)] text-xs font-medium',
            styles.fly
          )}
        >
          <PdfIcon className="w-3.5 h-[18px] text-[5px]" />
          {file}
        </span>
      );
    case 'uploading':
      return (
        <span className="flex flex-col flex-1 gap-1">
          <span className="text-xs text-primary-10">{file}</span>
          <span className="flex h-1 overflow-hidden rounded-sm bg-primary-2">
            <span
              className="h-full bg-primary-7"
              style={{ width: `${document.progress * 100}%` }}
            />
          </span>
        </span>
      );
    default:
      return (
        <span
          className={classNames(
            'flex items-center gap-2 text-[13px] text-primary-9',
            styles.fade
          )}
        >
          <Check className="size-[13px]" />
          <span className="underline">{file}</span>
        </span>
      );
  }
};

const DiagnosticScreen = ({ state }: ScreenProps) => (
  <Screen
    title="Compléter le diagnostic et les objectifs"
    subtitle="Consultez et complétez les indicateurs par volet du PCAET."
    footer={
      <>
        <PreviousButton />
        <NextButton label="Étape suivante" pressed={state.isClicking} />
      </>
    }
  >
    <div className="grid grid-cols-6 gap-2.5">
      {state.volets.map((volet) => (
        <div
          key={volet.name}
          className={classNames(
            'flex flex-col items-center justify-between h-24 px-1.5 py-2.5 text-center bg-white rounded-lg',
            volet.isActive
              ? 'border-2 border-primary-9'
              : 'border border-primary-3'
          )}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary-9"
          >
            <path d={volet.iconPath} />
          </svg>
          <span
            className={classNames(
              'text-[11px] leading-tight text-primary-9',
              volet.isActive ? 'font-bold' : 'font-medium'
            )}
          >
            {volet.name}
          </span>
          <VoletStatusBadge status={volet.status} />
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
  <div className="overflow-hidden bg-white border border-primary-3 rounded-lg">
    <div
      className={classNames(
        INDICATEURS_GRID,
        'items-center h-10 text-[13px] font-bold border-b border-primary-2 [&>span]:px-3.5'
      )}
    >
      <span className="text-primary-9">
        {activeVolet.name} ({activeVolet.unit})
      </span>
      {DIAGNOSTIC_YEARS.map((year, index) => (
        <span key={year} className="flex items-center gap-1.5">
          {index === 0 && (
            <span className="px-[3px] border border-primary-4 rounded-[3px] text-[8px] text-grey-8">
              RÉF.
            </span>
          )}
          {year}
        </span>
      ))}
    </div>
    {rows.map((row) => (
      <div
        key={row.sector}
        className={classNames(
          INDICATEURS_GRID,
          'items-center h-[35px] border-t border-primary-1'
        )}
      >
        <span className="flex items-center justify-between h-full px-3.5 text-xs text-primary-10 border-r border-primary-1">
          {row.sector}
          <Toggle isOn={row.isActive} className="w-8 h-[18px]" />
        </span>
        {row.cells.map((cell, column) => (
          <span
            key={column}
            className={classNames(
              'flex items-center gap-1.5 px-3.5 text-[13px] tabular-nums',
              cell.isTyping ? 'font-bold text-primary-7' : 'text-primary-10'
            )}
          >
            <span
              className={classNames(
                'flex items-center justify-center size-3 border border-primary-4 text-[8px] text-primary-7',
                column === 0 ? 'rounded-[3px]' : 'rounded-full'
              )}
            >
              {column === 0 ? 'R' : 'O'}
            </span>
            {cell.text}
          </span>
        ))}
      </div>
    ))}
  </div>
);

/** Objectif en cours d'écriture : une ligne squelette qui s'allonge. */
const TypedObjectif = ({
  progress,
  length,
}: {
  progress: number;
  length: number;
}) =>
  progress === 0 ? (
    <span className="text-[13px] text-grey-8">Saisir vos objectifs</span>
  ) : (
    <span className="flex items-center gap-0.5">
      <span
        className="h-2 rounded-full bg-primary-3"
        style={{ width: `${progress * length}%` }}
      />
      {progress < 1 && (
        <span className="w-0.5 h-3.5 bg-primary-7 animate-pulse" />
      )}
    </span>
  );

/** Volet vulnérabilité : des niveaux par thématique, comme dans l'app. */
const VulnerabiliteTable = ({
  thematiques,
}: {
  thematiques: NonNullable<DepotDemoState['vulnerabilite']>;
}) => (
  <div className="overflow-hidden bg-white border border-primary-3 rounded-lg">
    <div
      className={classNames(
        VULNERABILITE_GRID,
        'items-center h-12 text-[11px] font-bold leading-tight tracking-wide text-primary-10 border-b border-primary-2 [&>span]:px-3.5'
      )}
    >
      <span>THÉMATIQUES</span>
      {VULNERABILITE.horizons.map((horizon) => (
        <span key={horizon}>
          VULNÉRABILITÉ
          <br />
          {horizon.toUpperCase()}
        </span>
      ))}
      <span>OBJECTIFS 2050</span>
    </div>
    {thematiques.map((thematique, row) => (
      <div
        key={thematique.name}
        className={classNames(
          VULNERABILITE_GRID,
          'items-center h-[35px] border-t border-primary-1 [&>span]:px-3.5'
        )}
      >
        <span className="text-[13px] font-medium text-primary-9">
          {thematique.name}
        </span>
        {thematique.niveaux.map((niveau, horizon) => (
          <span key={horizon}>
            <NiveauVulnerabilite niveau={niveau} />
          </span>
        ))}
        <span>
          <TypedObjectif
            progress={thematique.objectifProgress}
            length={OBJECTIF_LENGTHS[row]}
          />
        </span>
      </div>
    ))}
  </div>
);

const ProgrammeScreen = ({ state }: ScreenProps) => (
  <Screen
    title="Renseigner le programme d'actions"
    subtitle="Liez votre programme d'actions à un plan de la plateforme, créez-en un ou importez-le."
    footer={
      <>
        <PreviousButton />
        <NextButton
          label="Valider le dépôt pour avis"
          enabled={state.programme.canValidate}
          pressed={state.isClicking}
        />
      </>
    }
  >
    <FakeButton className="absolute right-6 top-[22px] gap-2 px-3.5 py-[9px] text-[13px]">
      + Créer un plan
      <span className="pl-2 border-l border-white/40">▾</span>
    </FakeButton>
    <ImportDropzone phase={state.programme.importPhase} compact={false} />
    <div className="overflow-hidden bg-white border border-primary-3 rounded-lg">
      <div
        className={classNames(
          PLANS_GRID,
          'items-center h-9 text-[11px] font-bold tracking-wide [&>span]:px-4'
        )}
      >
        <span>NOM DU PLAN</span>
        <span>NOMBRE D&apos;ACTIONS</span>
        <span>VÉRIFICATION</span>
      </div>
      {state.programme.isPlanLinked ? (
        <div
          className={classNames(
            PLANS_GRID,
            'items-center h-[52px] bg-primary-0 border-t border-primary-2 [&>span]:px-4',
            styles.slideIn
          )}
        >
          <span className="text-sm font-medium text-primary-9">
            Programme d&apos;actions – PCAET
          </span>
          <span className="text-sm text-grey-8 tabular-nums">
            {state.programme.actionCount} actions
          </span>
          <span
            className={classNames(
              'flex items-center gap-2 text-xs font-bold',
              state.programme.isVerified ? 'text-success-1' : 'text-grey-8'
            )}
          >
            <PlanVerification isVerified={state.programme.isVerified} />
            Plan vérifié
          </span>
        </div>
      ) : (
        <div className="flex items-center h-[52px] px-4 text-[13px] text-grey-8 border-t border-primary-2">
          Aucun plan rattaché pour le moment.
        </div>
      )}
    </div>
    <div className="flex flex-col gap-1 px-4 py-3.5 rounded-lg bg-info-2">
      <span className="flex items-center gap-1.5 text-[13px] font-bold text-info-1">
        <Icon icon="information-line" size="sm" />
        Vérifiez vos plans avant de valider le dépôt
      </span>
      <span className="text-xs text-primary-10">
        Consultez les actions de chaque plan lié, corrigez-les si besoin, puis
        marquez le plan comme vérifié.
      </span>
    </div>
  </Screen>
);

const AvisScreen = ({ state }: ScreenProps) => (
  <Screen
    title={state.avis.title}
    subtitle={state.avis.subtitle}
    footer={
      state.avis.canAdopt && (
        <FakeButton
          pressed={state.isClicking}
          className={classNames('ml-auto px-5 py-2.5 text-sm', styles.popGlow)}
        >
          Adopter le PCAET
        </FakeButton>
      )
    }
  >
    <div className="grid grid-cols-[360px_minmax(0,1fr)] gap-6">
      <div className="relative h-[340px] overflow-hidden bg-white border border-primary-3 rounded-[10px]">
        <span className="absolute left-4 top-3.5 text-[11px] font-bold tracking-wider text-grey-8">
          COURRIER
        </span>
        {state.avis.mailArrived && (
          <Envelope
            isOpen={state.avis.mailOpened}
            report={state.avis.outgoingReport?.report}
            compact={false}
          />
        )}
      </div>
      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-bold tracking-wider text-grey-8">
          AVIS REÇUS
        </span>
        {state.avis.received.map((avis) =>
          avis.isReceived ? (
            <div
              key={avis.file}
              className={classNames(
                'flex items-center gap-3 h-16 px-4 bg-white border border-primary-3 rounded-lg',
                styles.slideIn
              )}
            >
              <PdfIcon className="w-[22px] h-7 text-[6px]" />
              <span className="flex flex-col flex-1">
                <span className="text-sm font-bold text-primary-9">
                  {avis.file}
                </span>
                <span className="text-xs text-grey-8">{avis.origin}</span>
              </span>
              <ReceivedBadge />
            </div>
          ) : (
            <div
              key={avis.file}
              className="flex items-center h-16 px-4 text-[13px] text-grey-8 border border-dashed border-primary-4 rounded-lg"
            >
              En attente de l&apos;avis de {avis.emitter}…
            </div>
          )
        )}
        {state.avis.isAdopted && <AdoptedBanner />}
      </div>
    </div>
  </Screen>
);

const ProgressPanel = ({ state }: ScreenProps) => (
  <div className="absolute left-[820px] top-11 flex flex-col gap-1.5 w-[380px] h-[676px] px-[22px] py-5 bg-white border-l border-primary-3">
    <span className="mb-1.5 text-[11px] font-bold tracking-wider text-grey-8">
      AVANCEMENT
    </span>
    {state.etapes.map((etape, index) => (
      <div
        key={etape.title}
        className="grid grid-cols-[28px_minmax(0,1fr)] gap-3"
      >
        <div className="flex flex-col items-center">
          <EtapeBullet
            status={etape.status}
            number={index + 1}
            className="size-7 text-[13px]"
          />
          {index < state.etapes.length - 1 && (
            <span
              className={classNames(
                'flex-1 w-0.5 min-h-3.5 my-1 transition-colors duration-300',
                etape.status === 'done' ? 'bg-success-1' : 'bg-primary-3'
              )}
            />
          )}
        </div>
        <div className="flex flex-col gap-1 pb-3">
          <span
            className={classNames(
              'pt-1 text-[15px] leading-snug text-primary-9',
              etape.status === 'active' ? 'font-bold' : 'font-medium'
            )}
          >
            {etape.title}
          </span>
          <span
            className={classNames(
              'text-xs leading-normal',
              etape.status === 'active' ? 'text-primary-10' : 'text-grey-8'
            )}
          >
            {etape.description}
          </span>
          {index === 0 && etape.status === 'active' && (
            <div className="flex flex-col gap-2 mt-2">
              {state.subSteps.map((subStep) => (
                <div
                  key={subStep.title}
                  className={classNames(
                    'grid grid-cols-[24px_minmax(0,1fr)] items-start gap-2.5 bg-white rounded-lg transition-colors duration-200',
                    subStep.isCurrent
                      ? 'px-[11px] py-[9px] border-2 border-primary-9'
                      : 'px-3 py-2.5 border border-primary-3'
                  )}
                >
                  {subStep.isDone ? (
                    <Check className="size-6" />
                  ) : (
                    <span className="flex items-center justify-center size-6 rounded-full bg-warning-2 text-xs font-bold text-warning-1">
                      ×
                    </span>
                  )}
                  <div className="flex flex-col gap-[3px]">
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="text-xs font-bold leading-tight text-primary-9">
                        {subStep.title}
                      </span>
                      <VoletStatusBadge
                        status={subStep.isDone ? 'complete' : 'todo'}
                      />
                    </div>
                    <span className="text-[11px] leading-snug text-grey-8">
                      {subStep.description}
                    </span>
                  </div>
                </div>
              ))}
              <FakeButton
                enabled={state.programme.canValidate}
                className="self-start px-3 py-2 text-xs"
              >
                Valider le dépôt pour avis →
              </FakeButton>
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);

const WIDE_SCREENS = {
  documents: DocumentsScreen,
  diagnostic: DiagnosticScreen,
  programme: ProgrammeScreen,
  avis: AvisScreen,
};

/** Scène desktop : l'écran de dépôt à gauche, le panneau Avancement à droite. */
export const DepotDemoWide = ({
  state,
  time,
}: {
  state: DepotDemoState;
  time: number;
}) => {
  const CurrentScreen = WIDE_SCREENS[state.screen];
  const cursor = getCurrentKeyframe(CURSOR.wide, time);

  return (
    <div className="relative size-full bg-grey-2 text-sm leading-[1.45] text-primary-10">
      <div className="flex items-center gap-3.5 h-11 px-5 bg-white border-b border-primary-3">
        <TerritoiresEnTransitionsLogo className="h-[30px] w-auto" />
        <span className="w-px h-5 bg-primary-3" />
        <span className="text-[13px] font-bold text-primary-9">
          Ma collectivité
        </span>
        <span className="text-[13px] text-grey-8">› Démarche PCAET</span>
        <span className="flex items-center justify-center ml-auto size-7 rounded-full bg-primary-2 text-[11px] font-bold text-primary-9">
          CM
        </span>
      </div>

      <div className="absolute left-0 top-11 w-[820px] h-[676px]">
        <CurrentScreen key={state.screen} state={state} />
      </div>
      <ProgressPanel state={state} />

      {state.showConfetti && <Confetti x={410} y={360} />}
      <DemoCursor
        x={cursor.x}
        y={cursor.y}
        visible={cursor.visible}
        transition={cursor.transition}
        pressed={state.isClicking}
        variant="mouse"
      />
    </div>
  );
};
