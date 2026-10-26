import { AnchorHTMLAttributes, forwardRef } from 'react';

/*
 * `next/link` hors de Next : un simple lien. Le design system publié affiche
 * les composants sans routeur, les props de navigation de Next sont ignorées.
 */
type Href = string | Readonly<{ pathname?: string | null }>;

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: Href;
  prefetch?: unknown;
  replace?: unknown;
  scroll?: unknown;
  shallow?: unknown;
};

const toHref = (href: Href): string =>
  typeof href === 'string' ? href : href.pathname ?? '#';

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      href,
      prefetch: _prefetch,
      replace: _replace,
      scroll: _scroll,
      shallow: _shallow,
      ...props
    },
    ref
  ) => <a ref={ref} href={toHref(href)} {...props} />
);
Link.displayName = 'Link';

export default Link;
