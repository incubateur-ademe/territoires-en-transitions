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
