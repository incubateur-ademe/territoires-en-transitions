import { cn, Icon, IconValue } from '@tet/ui';
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
};

/**
 * Presentational banner component used by the global widget and by the live
 * preview on the support edit page. Centered text, icon on the left of the
 * text run (not the side of the banner), and the wrapper enforces
 * `font-normal` so inline `<strong>` / `<b>` keep their semantics without
 * making the entire content bold.
 */
export function BannerInfoBox({ type, html, className }: BannerInfoBoxProps) {
  const styles = TYPE_STYLES[type];

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-3 px-6 py-3',
        styles.bg,
        styles.text,
        className
      )}
    >
      <Icon icon={styles.icon} className={cn('shrink-0', styles.text)} />
      <div
        className={cn(
          'text-sm font-normal text-center',
          // tighter vertical rhythm — banner is a single short message
          '[&>*]:my-0',
          // Tailwind preflight resets <a> to inherit color + no underline,
          // so links emitted by BlockNote (with href + target=_blank) would
          // render as plain text. Explicit underline + hover gives them
          // affordance while keeping the type palette colour.
          '[&_a]:underline [&_a:hover]:no-underline'
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
