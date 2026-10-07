import styles from '@/site/components/animated-demo/animated-demo.module.css';
import type { DemarchePcaetVulnerabiliteNiveau } from '@tet/domain/demarches';
import { Badge, BadgeProps, Icon } from '@tet/ui';
import classNames from 'classnames';
import { ReactNode } from 'react';
import { PROGRAMME_IMPORT } from './depot-demo.scenario';
import { EtapeStatus, ImportPhase, VoletStatus } from './depot-demo.state';

/**
 * Éléments partagés par les scènes large et compacte de la démo. Ils imitent
 * l'interface de l'app sans être interactifs : la démo se regarde.
 */

type BadgeSize = 'xs' | 'sm';

const Tick = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={3.5}
    className={className}
  >
    <path d="M5 12l5 5 9-10" />
  </svg>
);

/** Pastille verte cochée ; sa taille vient de `className`. */
export const Check = ({ className }: { className?: string }) => (
  <span
    className={classNames(
      'flex flex-none items-center justify-center rounded-full bg-success-1 text-white',
      styles.pop,
      className
    )}
  >
    <Tick className="size-[55%]" />
  </span>
);

export const Checkbox = ({
  checked,
  className,
}: {
  checked: boolean;
  className?: string;
}) =>
  checked ? (
    <span
      className={classNames(
        'flex flex-none items-center justify-center rounded-[3px] bg-primary-7 text-white',
        styles.pop,
        className
      )}
    >
      <Tick className="size-[65%]" />
    </span>
  ) : (
    <span
      className={classNames(
        'flex-none rounded-[3px] border border-primary-4 bg-white',
        className
      )}
    />
  );

export const PdfIcon = ({ className }: { className?: string }) => (
  <span
    className={classNames(
      'flex flex-none items-end justify-center pb-0.5 rounded-sm bg-error-1 font-bold text-white',
      className
    )}
  >
    PDF
  </span>
);

export const EtapeBullet = ({
  status,
  number,
  className,
}: {
  status: EtapeStatus;
  number: number;
  className?: string;
}) =>
  status === 'done' ? (
    <Check className={className} />
  ) : (
    <span
      className={classNames(
        'flex flex-none items-center justify-center rounded-full font-bold',
        status === 'active'
          ? 'bg-primary-7 text-white shadow-[0_0_0_4px_theme(colors.primary.3)]'
          : 'bg-white border border-primary-4 text-primary-9',
        className
      )}
    >
      {number}
    </span>
  );

const VOLET_STATUS_BADGES = {
  complete: { title: 'Complété', variant: 'success' },
  todo: { title: 'À compléter', variant: 'warning' },
  optional: { title: 'Optionnel', variant: 'grey' },
} as const;

export const VoletStatusBadge = ({
  status,
  size = 'sm',
}: {
  status: VoletStatus;
  size?: BadgeSize;
}) => (
  <Badge
    title={VOLET_STATUS_BADGES[status].title}
    variant={VOLET_STATUS_BADGES[status].variant}
    size={size}
    trim={false}
    className="flex-none"
  />
);

export const DocumentTypeBadge = ({
  required,
  size = 'sm',
}: {
  required: boolean;
  size?: BadgeSize;
}) => (
  <Badge
    title={required ? 'Obligatoire' : 'Optionnel'}
    variant={required ? 'standard' : 'grey'}
    size={size}
    uppercase={false}
    trim={false}
    className="flex-none"
  />
);

export const ReceivedBadge = ({ size = 'sm' }: { size?: BadgeSize }) => (
  <Badge title="Reçu" variant="success" size={size} className="flex-none" />
);

/**
 * Mêmes libellés et couleurs que le tableau de vulnérabilité de l'app
 * (`DEMARCHE_PCAET_VULNERABILITE_NIVEAU_*`, que le site ne peut pas importer).
 */
const NIVEAU_BADGES: Record<
  DemarchePcaetVulnerabiliteNiveau,
  { label: string; variant: NonNullable<BadgeProps['variant']> }
> = {
  non_concerne: { label: 'non concerné', variant: 'grey' },
  faible: { label: 'faible', variant: 'success' },
  moyen: { label: 'moyen', variant: 'warning' },
  fort: { label: 'fort', variant: 'error' },
};

/** Niveau saisi, ou l'invite « + niveau » de l'app tant qu'il ne l'est pas. */
export const NiveauVulnerabilite = ({
  niveau,
  size = 'sm',
}: {
  niveau: DemarchePcaetVulnerabiliteNiveau | null;
  size?: BadgeSize;
}) =>
  niveau ? (
    <span className={styles.pop}>
      <Badge
        title={NIVEAU_BADGES[niveau].label}
        variant={NIVEAU_BADGES[niveau].variant}
        size={size}
        trim={false}
        className="whitespace-nowrap"
      />
    </span>
  ) : (
    <span
      className={classNames(
        'text-grey-8 opacity-60',
        size === 'xs' ? 'text-[11px]' : 'text-[13px]'
      )}
    >
      + niveau
    </span>
  );

/** Bouton de l'app imité ; `pressed` le fonce pendant un clic simulé. */
export const FakeButton = ({
  variant = 'primary',
  enabled = true,
  pressed = false,
  className,
  children,
}: {
  variant?: 'primary' | 'secondary';
  enabled?: boolean;
  pressed?: boolean;
  className?: string;
  children: ReactNode;
}) => (
  <span
    className={classNames(
      'flex items-center justify-center gap-2 rounded-md font-bold transition-colors duration-200',
      variant === 'secondary'
        ? 'border border-primary-9 text-primary-9'
        : {
            'bg-primary-3 text-primary-6': !enabled,
            'bg-primary-10 text-white': enabled && pressed,
            'bg-primary-9 text-white': enabled && !pressed,
          },
      className
    )}
  >
    {children}
  </span>
);

/** Zone de dépôt du programme d'actions, au fil de l'import. */
export const ImportDropzone = ({
  phase,
  compact,
}: {
  phase: ImportPhase;
  compact: boolean;
}) => (
  <div
    className={classNames(
      'relative flex flex-none items-center justify-center px-3 text-center border-2 border-dashed rounded-[10px] transition-colors duration-200',
      compact ? 'h-[104px]' : 'h-[118px]',
      {
        'border-primary-4 bg-primary-0': phase === 'idle',
        'border-primary-7 bg-primary-2':
          phase === 'flying' || phase === 'loading',
        'border-success-1 bg-success-2': phase === 'done',
      }
    )}
  >
    {phase === 'idle' && (
      <div className="flex flex-col items-center gap-1 text-primary-9">
        <Icon icon="upload-2-line" size={compact ? 'md' : 'lg'} />
        <span
          className={classNames(
            'font-bold',
            compact ? 'text-[13px]' : 'text-sm'
          )}
        >
          {compact
            ? 'Importer un programme existant'
            : "Importer un programme d'actions existant"}
        </span>
        <span className="text-xs text-grey-8">PDF, Word ou Excel</span>
      </div>
    )}
    {phase === 'flying' && (
      <span
        className={classNames(
          'flex items-center gap-2 px-3 py-2 bg-white border border-primary-3 rounded-lg shadow-[0_10px_24px_rgba(64,64,146,0.22)] text-[13px] font-medium',
          styles.fly
        )}
      >
        <PdfIcon className="w-[18px] h-[22px] text-[6px]" />
        {PROGRAMME_IMPORT.file}
      </span>
    )}
    {phase === 'loading' && (
      <div className="flex items-center gap-3 text-primary-9">
        <span
          className={classNames(
            'size-5 rounded-full border-[3px] border-primary-3 border-t-primary-7',
            styles.spin
          )}
        />
        <span className="flex flex-col text-left">
          <span className="text-sm font-bold">Import en cours…</span>
          {!compact && (
            <span className="text-xs text-grey-8">
              Extraction des actions de « {PROGRAMME_IMPORT.file} »
            </span>
          )}
        </span>
      </div>
    )}
    {phase === 'done' && (
      <div
        className={classNames(
          'flex items-center gap-2.5 text-sm font-bold text-success-1',
          styles.pop
        )}
      >
        <Check className="size-5" />
        {compact
          ? 'Programme importé'
          : `Programme importé depuis « ${PROGRAMME_IMPORT.file} »`}
      </div>
    )}
  </div>
);

/** Enveloppe qui s'ouvre et laisse sortir les rapports d'avis. */
export const Envelope = ({
  isOpen,
  report,
  compact,
}: {
  isOpen: boolean;
  report?: string;
  compact: boolean;
}) => (
  <div
    className={classNames(
      'absolute',
      compact
        ? 'left-[111px] top-11 w-[110px] h-[72px]'
        : 'left-[100px] top-[170px] w-40 h-[104px]',
      styles.drop
    )}
  >
    <div className="absolute inset-0 z-0 rounded-md bg-primary-4" />
    {report && (
      <span
        key={report}
        className={classNames(
          'absolute z-[1] flex items-center gap-1.5 bg-white border border-primary-3 rounded-md font-bold text-primary-10',
          compact
            ? 'left-2.5 top-2 w-[90px] h-[30px] px-1.5 text-[9px]'
            : 'left-[18px] top-3.5 w-[124px] h-10 px-2 text-[11px]',
          styles.rise
        )}
      >
        <span
          className={classNames(
            'flex-none rounded-sm bg-error-1',
            compact ? 'w-2.5 h-[13px]' : 'w-3.5 h-[18px]'
          )}
        />
        {report}
      </span>
    )}
    <div className="absolute inset-0 z-[2] rounded-md bg-primary-3 [clip-path:polygon(0_0,50%_58%,100%_0,100%_100%,0_100%)]" />
    <div
      className={classNames(
        'absolute inset-x-0 top-0 origin-top bg-primary-7 [clip-path:polygon(0_0,100%_0,50%_100%)] transition-transform duration-[400ms] ease-in-out',
        compact ? 'h-[42px]' : 'h-[60px]',
        isOpen ? '-scale-y-100 z-0' : 'z-[3]'
      )}
    />
  </div>
);

/** Interrupteur de l'app : la pastille glisse quand la ligne est saisie. */
export const Toggle = ({
  isOn,
  className,
}: {
  isOn: boolean;
  className?: string;
}) => (
  <span
    className={classNames(
      'relative flex-none rounded-full transition-colors duration-200',
      isOn ? 'bg-primary-7' : 'bg-primary-4',
      className
    )}
  >
    <span
      className={classNames(
        'absolute top-0.5 aspect-square h-[calc(100%-4px)] rounded-full bg-white transition-[left] duration-200',
        isOn ? 'left-[calc(100%-2px)] -translate-x-full' : 'left-0.5'
      )}
    />
  </span>
);

export const PlanVerification = ({ isVerified }: { isVerified: boolean }) =>
  isVerified ? (
    <span
      className={classNames(
        'flex items-center justify-center size-4 rounded-[3px] bg-success-1 text-white',
        styles.pop
      )}
    >
      <Icon icon="check-line" size="2xs" />
    </span>
  ) : (
    <span className="size-4 rounded-[3px] border border-primary-4 bg-white" />
  );

export const AdoptedBanner = ({ compact = false }: { compact?: boolean }) => (
  <div
    className={classNames(
      'flex items-center gap-2.5 bg-success-2 border border-success-1 rounded-lg font-bold text-success-1',
      compact ? 'px-3 py-2.5 text-sm' : 'mt-2 px-4 py-3.5 text-[15px]',
      styles.pop
    )}
  >
    <Check className={compact ? 'size-5' : 'size-[22px]'} />
    PCAET adopté et publié
  </div>
);
