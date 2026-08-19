'use client';

import {
  installSafeLinksHook,
  SAFE_HTML_CONFIG,
  type BannerOutput,
} from '@tet/domain/utils';
import DOMPurify from 'dompurify';
import { BannerInfoBox } from './banner-info.box';
import { isUrgentBannerType } from './banner-info.utils';
import { useDismissBannerInfo } from './use-dismiss-banner-info';
import { useGetBannerInfo } from './use-get-banner-info';

// Install the rel="noopener noreferrer" hook on the browser DOMPurify
// instance once at module load. The hook is shared with the server pass via
// `installSafeLinksHook` in `@tet/domain/utils`.
installSafeLinksHook(DOMPurify);

function DismissibleBannerInfo({ banner }: { banner: BannerOutput }) {
  const { isVisible, dismiss } = useDismissBannerInfo(banner.modifiedAt);

  if (!isVisible) {
    return null;
  }

  // DOMPurify already ran server-side on insert/update; this second pass is
  // defense in depth at the point of rendering.
  const sanitizedHtml = DOMPurify.sanitize(banner.info, SAFE_HTML_CONFIG);
  const urgent = isUrgentBannerType(banner.type);

  return (
    <div
      role={urgent ? 'alert' : 'status'}
      aria-live={urgent ? 'assertive' : 'polite'}
    >
      <BannerInfoBox
        type={banner.type}
        html={sanitizedHtml}
        onDismiss={dismiss}
      />
    </div>
  );
}

/**
 * Fetches the latest banner from `trpc.banner.get` and renders it at the top
 * of the authed content (in normal flow — no sticky). Returns null when no
 * banner is active, the row is empty, or the fetch fails (silent — react-query
 * logs errors). The query may return an inactive draft (used by the support
 * edit page); the widget filters it out client-side.
 */
export default function BannerInfo() {
  const { data, isLoading, isError } = useGetBannerInfo();

  if (isLoading || isError) {
    return null;
  }

  if (!data || !data.active || data.info.trim() === '') {
    return null;
  }

  return <DismissibleBannerInfo banner={data} />;
}
