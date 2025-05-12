import { trpc } from '@/api/utils/trpc/client';

export const useGetUser = (email: string) =>
  trpc.utilisateurs.get.useQuery({ email });
