import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { PageContainer } from '@/ui';

export default function Loading() {
  return (
    <PageContainer containerClassName="grow flex flex-col justify-center">
      <SpinnerLoader className="m-auto" />
    </PageContainer>
  );
}
