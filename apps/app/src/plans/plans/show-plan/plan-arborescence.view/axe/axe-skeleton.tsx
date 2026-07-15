import { Icon } from '@tet/ui';
import { RiArrowRightSFill } from '@remixicon/react';

export const AxeSkeleton = () => {
  return (
    <div className="flex items-center w-full px-2 py-2 ">
      <Icon icon={<RiArrowRightSFill />} size="lg" className="text-grey-5" />
      <div className="animate-pulse h-8 w-full ml-6 rounded-sm bg-gray-200" />
    </div>
  );
};
