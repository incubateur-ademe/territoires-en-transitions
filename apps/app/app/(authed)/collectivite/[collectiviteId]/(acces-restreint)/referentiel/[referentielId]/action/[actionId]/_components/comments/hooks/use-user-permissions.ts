import { useUser } from '@/api/users/user-context/user-provider';

export const useUserPermissions = (createdBy: string) => {
  const user = useUser();

  return {
    canDeleteComment: user && user.id === createdBy,
  };
};
