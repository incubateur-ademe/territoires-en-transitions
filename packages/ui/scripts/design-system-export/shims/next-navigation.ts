/*
 * `next/navigation` hors de Next : une page fixe, sans routeur. Les composants
 * qui lisent l'URL s'affichent dans leur état par défaut.
 */
const noop = (): void => undefined;

export const usePathname = (): string => '/';

export const useParams = (): Readonly<Record<string, string>> => ({});

export const useSearchParams = (): URLSearchParams => new URLSearchParams();

export const useRouter = () => ({
  push: noop,
  replace: noop,
  back: noop,
  forward: noop,
  refresh: noop,
  prefetch: noop,
});
