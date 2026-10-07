import { appLabels } from '@/app/labels/catalog';
import { Button, cn, Icon, IconValue } from '@tet/ui';
import type { BannerType } from '@tet/domain/utils';

type TypeStyle = {
  bg: string;
  text: string;
  icon: IconValue;
};

const TYPE_STYLES: Record<BannerType, TypeStyle> = {
  info: {
    bg: 'bg-info-2',
    text: 'text-info-1',
    icon: 'information-fill',
  },
  warning: {
    bg: 'bg-warning-2',
    text: 'text-warning-1',
    icon: 'information-fill',
  },
  error: {
    bg: 'bg-error-2',
    text: 'text-error-1',
    icon: 'spam-fill',
  },
  event: {
    // event reuses the info palette but is distinguished by the calendar icon
    bg: 'bg-info-2',
    text: 'text-info-1',
    icon: 'calendar-event-fill',
  },
};

type BannerInfoBoxProps = {
  type: BannerType;
  /** Sanitized HTML to render. Caller is responsible for DOMPurify. */
  html: string;
  className?: string;
  onDismiss?: () => void;
};

/**
 * Presentational banner component used by the global widget and by the live
 * preview on the support edit page. The icon sits on the left of the text run
 * (not the side of the banner) and is optically centred on its first line, so
 * a message wrapping over several lines keeps the icon anchored to the top
 * instead of drifting to the middle. The wrapper enforces `font-normal` so
 * inline `<strong>` / `<b>` keep their semantics without making the entire
 * content bold.
 */
export function BannerInfoBox({
  type,
  html,
  className,
  onDismiss,
}: BannerInfoBoxProps) {
  const styles = TYPE_STYLES[type];

  return (
    <div className={cn('px-6 py-3', styles.bg, styles.text, className)}>
      {/* même largeur de contenu que app-layout, pour ne pas tasser le texte */}
      <div className="mx-auto flex max-w-[90rem] items-start gap-3">
        <div className="flex min-w-0 grow items-start justify-center gap-3">
          {/* h-5 matches the text-sm line height, centring the icon on the first line */}
          <span className="flex h-5 shrink-0 items-center">
            <Icon icon={styles.icon} className={styles.text} />
          </span>
          <div
            className={cn(
              'min-w-0 text-sm font-normal',
              // BlockNote nests the paragraph four wrappers deep, so only a
              // descendant selector reaches it — a child one leaves the inner
              // margins in place and the banner grows an uneven gap
              '[&_*]:my-0',
              // Tailwind preflight resets <a> to inherit color + no underline,
              // so links emitted by BlockNote (with href + target=_blank) would
              // render as plain text. Explicit underline + hover gives them
              // affordance while keeping the type palette colour.
              '[&_a]:underline [&_a:hover]:no-underline'
            )}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
        {onDismiss && (
          <Button
            variant="unstyled"
            size="xs"
            icon="close-line"
            title={appLabels.banniereFermer}
            aria-label={appLabels.banniereFermer}
            className={cn(
              'flex h-5 shrink-0 items-center hover:opacity-70',
              styles.text
            )}
            onClick={onDismiss}
            dataTest="banner.dismiss-button"
          />
        )}
      </div>
    </div>
  );
}
