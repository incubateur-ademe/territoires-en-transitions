import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import PageContainer from '@/ui/components/layout/page-container';

export default function Loading() {
  return (
    <PageContainer>
      <SpinnerLoader />
    </PageContainer>
  );
}
