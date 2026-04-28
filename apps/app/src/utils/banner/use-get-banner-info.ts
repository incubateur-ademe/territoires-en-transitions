import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useGetBannerInfo = () => {
  const trpc = useTRPC();
  return useQuery(
    trpc.banner.get.queryOptions(undefined, {
      // Background refetches mid-edit would silently overwrite RHF state
      // on the support edit page; the banner is a singleton edited rarely,
      // so window-focus refetch has minimal value here and the cost is
      // unsaved-content loss.
      refetchOnWindowFocus: false,
    })
  );
};
