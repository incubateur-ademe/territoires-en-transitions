import { Meta, StoryObj } from '@storybook/nextjs';
import { Select } from '../Select';
import { InlineEditWrapper } from './inline-edit.wrapper';

const meta: Meta<typeof InlineEditWrapper> = {
  component: InlineEditWrapper,
  title: 'Design System/Inline edit',
};

export default meta;

type Story = StoryObj<typeof InlineEditWrapper>;

export const Default: Story = {
  render: () => (
    <InlineEditWrapper
      renderOnEdit={({ openState }) => (
        <div className="w-80">
          <Select
            values={undefined}
            onChange={() => null}
            buttonClassName="border-0 border-b"
            displayOptionsWithoutFloater
            openState={openState}
            options={[
              { label: 'Admin', value: 'admin' },
              { label: 'Editor', value: 'editor' },
              { label: 'Viewer', value: 'viewer' },
            ]}
          />
        </div>
      )}
    >
      <div className="inline-flex items-center gap-2 py-3 px-2 border border-primary-3 rounded-lg">
        <div className="w-8 h-8 bg-primary-6 rounded-full" />
        <div className="text-primary-8 font-medium">Harry Cot</div>
      </div>
    </InlineEditWrapper>
  ),
};
