import { ContentLayout } from '../content-layout';
import { MoyensContent } from './moyens.content';

export const MoyensView = () => {
  return (
    <ContentLayout.Root>
      <ContentLayout.Content data={[]}>
        <MoyensContent />
      </ContentLayout.Content>
    </ContentLayout.Root>
  );
};
