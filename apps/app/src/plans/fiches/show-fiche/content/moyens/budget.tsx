import { ContentLayout } from '../content-layout';
import { BudgetContent } from './budget.content';

export const BudgetView = () => {
  return (
    <ContentLayout.Root>
      <ContentLayout.Content data={[]}>
        <BudgetContent />
      </ContentLayout.Content>
    </ContentLayout.Root>
  );
};
