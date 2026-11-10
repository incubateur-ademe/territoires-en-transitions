import styles from '@/site/components/animated-demo/animated-demo.module.css';
import { Confetti } from '@/site/components/animated-demo/confetti';
import { DemoCursor } from '@/site/components/animated-demo/demo-cursor';
import { getCurrentKeyframe } from '@/site/components/animated-demo/timeline';
import { Icon, TerritoiresEnTransitionsLogo } from '@tet/ui';
import classNames from 'classnames';
import { ReactNode } from 'react';
import {
  AdoptedBanner,
  AvisDownloadButton,
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
  CURSOR,
  DELIBERATION_ADOPTION,
  DIAGNOSTIC_YEARS,
  OBJECTIF_HORIZONS,
  PCAET_PLAN_TYPE_LABEL,
  PROGRAMME_IMPORT,
  VULNERABILITE,
} from './depot-demo.scenario';
import { DepotDemoState } from './depot-demo.state';

export const WIDE_SCENE = { width: 1200, height: 720 };

const DOCUMENTS_GRID = 'grid grid-cols-[120px_minmax(0,1fr)_270px]';
const INDICATEURS_GRID = 'grid grid-cols-[270px_repeat(4,minmax(0,1fr))]';
const VULNERABILITE_GRID =
  'grid grid-cols-[140px_repeat(3,120px)_repeat(2,minmax(0,1fr))]';
const PLANS_GRID = 'grid grid-cols-[minmax(0,1fr)_90px_190px]';

/** Longueur finale de chaque objectif « écrit », pour varier les lignes. */
const OBJECTIF_LENGTHS = [85, 70, 95, 75, 90, 65, 80, 72, 88, 68];

/** Libellé de la case d'inclusion : « Inclus dans « A », « B » et/ou « C » ». */
const formatInclusion = (names: string[]) => {
  const cited = names.map((name) => `« ${name} »`);
  return cited.length > 1
    ? `Inclus dans ${cited.slice(0, -1).join(', ')} et/ou ${cited.at(-1)}`
    : `Inclus dans ${cited.join('')}`;
};

type ScreenProps = { state: DepotDemoState };

const Screen = ({
  title,
  subtitle,
  action,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) => (
  <div
    className={classNames(
      'absolute inset-0 flex flex-col gap-3.5 px-6 py-[22px]',
      styles.fade
    )}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="m-0 text-xl font-bold text-primary-9">{title}</h3>
        <p className="m-0 mt-1 text-[13px] text-grey-8">{subtitle}</p>
      </div>
      {action}
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

const DiagnosticScreen = ({ state }: ScreenProps) => (
  <Screen
    title="Compléter les données du diagnostic et de la stratégie"
    subtitle="Compléter et consulter les données issues de votre diagnostic et les objectifs de votre stratégie territoriale."
    footer={<NextButton label="Étape suivante" pressed={state.isClicking} />}
  >
    <div className="grid grid-cols-6 gap-2.5">
      {state.volets.map((volet) => (
        <div
          key={volet.name}
          className={classNames(
            'flex flex-col items-center justify-between h-[88px] px-1.5 py-2 text-center bg-white rounded-lg',
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
          <CompletionBadge statut={volet.status} size="xs" withIcon={false} />
        </div>
      ))}
    </div>
    <p className="m-0 text-xs leading-snug text-primary-9">
      {state.activeVolet.description}
    </p>
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
        {activeVolet.tableTitle ?? activeVolet.name} ({activeVolet.unit})
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
        key={row.label}
        className={classNames(
          INDICATEURS_GRID,
          'items-center h-[35px] border-t border-primary-1'
        )}
      >
        <span className="flex items-center justify-between gap-2 h-full px-3.5 text-xs text-primary-10 border-r border-primary-1">
          <span className="truncate">{row.label}</span>
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
  /** `null` : horizon non concerné, rien n'est attendu. */
  progress: number | null;
  length: number;
}) =>
  progress === null ? (
    <span className="text-[11px] text-grey-6">—</span>
  ) : progress === 0 ? (
    <span className="text-xs text-grey-8">Saisir vos objectifs</span>
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

/** Volet vulnérabilité : des niveaux et des objectifs par thématique, comme dans l'app. */
const VulnerabiliteTable = ({
  thematiques,
}: {
  thematiques: NonNullable<DepotDemoState['vulnerabilite']>;
}) => (
  <div className="overflow-hidden bg-white border border-primary-3 rounded-lg">
    <div
      className={classNames(
        VULNERABILITE_GRID,
        'items-center h-12 text-[10px] font-bold leading-tight tracking-wide text-primary-10 border-b border-primary-2 [&>span]:px-3'
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
      {OBJECTIF_HORIZONS.map((horizon) => (
        <span key={horizon}>OBJECTIFS {horizon}</span>
      ))}
    </div>
    {thematiques.map((thematique, row) => (
      <div
        key={thematique.name}
        className={classNames(
          VULNERABILITE_GRID,
          'items-center h-[30px] border-t border-primary-1 [&>span]:px-3'
        )}
      >
        <span className="text-xs font-medium text-primary-9">
          {thematique.name}
        </span>
        {thematique.niveaux.map((niveau, horizon) => (
          <span key={horizon}>
            <NiveauVulnerabilite niveau={niveau} size="xs" />
          </span>
        ))}
        {thematique.objectifs.map((progress, horizon) => (
          <span key={horizon}>
            <TypedObjectif
              progress={progress}
              length={OBJECTIF_LENGTHS[(row + horizon) % OBJECTIF_LENGTHS.length]}
            />
          </span>
        ))}
      </div>
    ))}
  </div>
);

const DocumentsScreen = ({ state }: ScreenProps) => (
  <Screen
    title="Ajouter les documents attendus"
    subtitle="Déposer les pièces usuelles attendues."
    footer={
      <>
        <PreviousButton />
        <NextButton label="Étape suivante" pressed={state.isClicking} />
      </>
    }
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
  if (document.inclusion && document.isInclusionDeclarable) {
    return (
      <span className="flex items-center gap-2 text-[11px] leading-snug text-primary-9">
        <Checkbox checked={document.isIncluded} className="size-4" />
        {formatInclusion(document.inclusion.in)}
      </span>
    );
  }
  return (
    <DocumentUpload
      phase={document.phase}
      progress={document.progress}
      file={document.upload?.file ?? ''}
    />
  );
};

const ProgrammeScreen = ({ state }: ScreenProps) => {
  const { programme } = state;
  return (
    <Screen
      title="Associer ou créer le programme d'actions détaillé"
      subtitle="Associer un plan existant pour le transmettre comme programme d'actions, ou créer un plan pour l'associer."
      action={
        !programme.hasPlan && (
          <ImportSplitButton
            variant="primary"
            isLoading={false}
            className="flex-none"
          />
        )
      }
      footer={
        <>
          <PreviousButton />
          <NextButton
            label="Valider le dépôt et transmettre pour avis"
            enabled={programme.canValidate}
            pressed={state.isClicking}
          />
        </>
      }
    >
      <div className="overflow-hidden bg-white border border-primary-3 rounded-lg">
        <div
          className={classNames(
            PLANS_GRID,
            'items-center h-9 text-[11px] font-bold tracking-wide [&>span]:px-4'
          )}
        >
          <span>NOM DU PLAN</span>
          <span>ACTIONS</span>
          <span />
        </div>
        {programme.hasPlan ? (
          <div
            className={classNames(
              PLANS_GRID,
              'items-center h-[60px] border-t border-primary-2 [&>span]:px-4',
              programme.importPhase === 'done' && 'bg-primary-1',
              styles.slideIn
            )}
          >
            <span className="flex flex-col gap-0.5">
              <span className="text-[13px] font-medium text-primary-9">
                {programme.planName}
                {programme.importPhase === 'done' && (
                  <Icon icon="external-link-line" size="xs" className="ml-1.5" />
                )}
              </span>
              {programme.importPhase === 'done' ? (
                <span className="text-[11px] text-grey-8">
                  Généré depuis votre PDF
                </span>
              ) : (
                <span className="flex items-center gap-2 text-[11px] text-grey-8">
                  <span
                    className={classNames(
                      'size-3 rounded-full border-2 border-primary-3 border-t-primary-7',
                      styles.spin
                    )}
                  />
                  Import en cours…
                </span>
              )}
            </span>
            <span className="text-sm text-grey-8 tabular-nums">
              {programme.importPhase === 'done' && programme.actionCount}
            </span>
            <span className="flex items-center justify-end">
              {programme.importPhase === 'done' && (
                <FakeButton
                  variant="secondary"
                  className="px-2.5 py-1.5 text-[11px]"
                >
                  <Icon icon="link-unlink" size="xs" />
                  Dissocier
                </FakeButton>
              )}
            </span>
          </div>
        ) : (
          <div className="relative flex items-center justify-center h-[76px] px-4 text-center text-[13px] font-medium text-grey-8 border-t border-primary-2">
            {programme.importPhase === 'flying' ? (
              <span
                className={classNames(
                  'flex items-center gap-2 px-3 py-2 bg-white border border-primary-3 rounded-lg shadow-[0_10px_24px_rgba(64,64,146,0.22)] text-[13px] font-medium text-primary-10',
                  styles.fly
                )}
              >
                <PdfIcon className="w-[18px] h-[22px] text-[6px]" />
                {PROGRAMME_IMPORT.file}
              </span>
            ) : (
              <>
                Aucun plan de type « {PCAET_PLAN_TYPE_LABEL} » trouvé pour cette
                collectivité.
              </>
            )}
          </div>
        )}
      </div>
      {programme.hasPlan && (
        <div className={classNames('flex', styles.fade)}>
          <ImportSplitButton
            variant="secondary"
            isLoading={programme.importPhase === 'loading'}
          />
        </div>
      )}
    </Screen>
  );
};

const AvisScreen = ({ state }: ScreenProps) => {
  const { avis } = state;
  return (
    <Screen
      title={avis.title}
      subtitle={avis.subtitle}
      footer={
        avis.isPublishButtonVisible && (
          <FakeButton
            enabled={avis.canPublish}
            pressed={state.isClicking}
            className={classNames(
              'ml-auto px-5 py-2.5 text-sm',
              avis.canPublish && styles.popGlow
            )}
          >
            Valider le dépôt final <Icon icon="arrow-right-line" size="sm" />
          </FakeButton>
        )
      }
    >
      <div className="grid grid-cols-[300px_minmax(0,1fr)] gap-6">
        <div className="relative h-[340px] overflow-hidden bg-white border border-primary-3 rounded-[10px]">
          <span className="absolute left-4 top-3.5 text-[11px] font-bold tracking-wider text-grey-8">
            COURRIER
          </span>
          {avis.mailArrived && (
            <Envelope
              isOpen={avis.mailOpened}
              report={avis.outgoingReport?.report}
              compact={false}
            />
          )}
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-[11px] font-bold tracking-wider text-grey-8">
            AVIS REÇUS
          </span>
          {avis.received.map((unAvis) =>
            unAvis.isReceived ? (
              <div
                key={unAvis.auTitreDe}
                className={classNames(
                  'flex items-center gap-3 h-16 px-4 bg-grey-1 border border-grey-3 rounded-lg',
                  styles.slideIn
                )}
              >
                <span className="flex flex-col flex-1 gap-0.5">
                  <span className="text-sm font-medium text-primary-9">
                    {unAvis.auTitreDe}
                  </span>
                  <span className="text-xs text-grey-8">
                    Avis rendu le {unAvis.renduLe}
                  </span>
                </span>
                <AvisDownloadButton />
              </div>
            ) : (
              <div
                key={unAvis.auTitreDe}
                className="flex items-center h-16 px-4 text-[13px] text-grey-8 border border-dashed border-primary-4 rounded-lg"
              >
                En attente de l&apos;avis {unAvis.emitter}…
              </div>
            )
          )}
          {avis.showAdoptionPieces && (
            <div className={classNames('flex flex-col gap-3', styles.fade)}>
              <span className="text-[11px] font-bold tracking-wider text-grey-8">
                PIÈCES DE L&apos;ADOPTION
              </span>
              <div className="flex items-center gap-3 min-h-[52px] px-4 py-2 bg-white border border-primary-3 rounded-lg">
                <DocumentTypeBadge required />
                <span className="flex-1 text-xs font-medium leading-tight text-primary-9">
                  {DELIBERATION_ADOPTION.name}
                </span>
                <DocumentUpload
                  phase={avis.deliberation.phase}
                  progress={avis.deliberation.progress}
                  file={DELIBERATION_ADOPTION.file}
                />
              </div>
            </div>
          )}
          {avis.isAdopted && <AdoptedBanner />}
        </div>
      </div>
    </Screen>
  );
};

/** Panneau « Les étapes de votre démarche », comme le stepper de l'app. */
const ProgressPanel = ({ state }: ScreenProps) => (
  <div className="absolute left-[820px] top-11 flex flex-col gap-1 w-[380px] h-[676px] px-[22px] py-5 bg-white border-l border-primary-3">
    <span className="mb-1.5 text-[11px] font-bold tracking-wider text-grey-8">
      LES ÉTAPES DE VOTRE DÉMARCHE
    </span>
    {state.etapes.map((etape, index) => {
      const isLast = index === state.etapes.length - 1;
      const isReached = etape.status !== 'upcoming';
      return (
        <div
          key={etape.title}
          className={classNames(
            'grid grid-cols-[28px_minmax(0,1fr)] gap-3 transition-opacity duration-300',
            etape.status === 'done' && 'opacity-50'
          )}
        >
          <div className="flex flex-col items-center">
            <EtapeBullet
              status={etape.status}
              number={index + 1}
              className="size-7 text-[13px]"
            />
            {!isLast && (
              <span
                className={classNames(
                  'flex-1 w-0.5 min-h-3 my-1 transition-colors duration-300',
                  etape.status === 'done' ? 'bg-primary-7' : 'bg-grey-3'
                )}
              />
            )}
          </div>
          <div className="flex flex-col gap-0.5 pb-2">
            <span className="pt-1 text-sm font-medium leading-snug text-primary-9">
              {etape.title}
            </span>
            <span
              className={classNames(
                'text-[10.5px] leading-[1.35]',
                isReached ? 'text-primary-10' : 'text-grey-6'
              )}
            >
              {etape.description}
            </span>
            {index === 0 && state.isElaborating && (
              <div className="flex flex-col gap-1.5 mt-1.5">
                {state.subSteps.map((subStep) => (
                  <div
                    key={subStep.title}
                    className={classNames(
                      'flex flex-col items-start gap-1 rounded-lg transition-colors duration-200',
                      subStep.isCurrent
                        ? 'p-[7px] border-2 border-primary-7 bg-primary-0'
                        : 'p-2 border border-grey-3 bg-white'
                    )}
                  >
                    <CompletionBadge statut={subStep.status} size="xs" />
                    <span className="text-[11px] font-medium leading-tight text-primary-9">
                      {subStep.title}
                    </span>
                    <span className="text-[10px] leading-tight text-grey-7">
                      {subStep.description}
                    </span>
                  </div>
                ))}
                <FakeButton
                  enabled={state.programme.canValidate}
                  className="self-start px-3 py-1.5 text-[11px]"
                >
                  Valider le dépôt et transmettre pour avis
                  <Icon icon="arrow-right-line" size="xs" />
                </FakeButton>
              </div>
            )}
            {index === 2 && state.isFinalisation && (
              <FakeButton
                enabled={state.avis.canPublish}
                className="self-start mt-1.5 px-3 py-1.5 text-[11px]"
              >
                Valider le dépôt final
                <Icon icon="arrow-right-line" size="xs" />
              </FakeButton>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

const WIDE_SCREENS = {
  diagnostic: DiagnosticScreen,
  documents: DocumentsScreen,
  programme: ProgrammeScreen,
  avis: AvisScreen,
};

/** Scène desktop : l'écran de dépôt à gauche, le panneau des étapes à droite. */
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
        <span className="flex items-center gap-1.5 ml-auto px-2.5 py-1 rounded-md bg-primary-9 text-[11px] font-bold text-white">
          <Icon icon="list-check" size="xs" />
          Étapes
        </span>
        <span className="flex items-center justify-center size-7 rounded-full bg-primary-2 text-[11px] font-bold text-primary-9">
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
