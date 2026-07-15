import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { colorVariants, sizeVariants, typeVariants } from '@tet/design-tokens';
import { action } from 'storybook/actions';
import { StoryWrapper } from '../../storybook/story.wrapper';
import { Divider } from '../Divider/Divider';
import { Badge } from './Badge';
import { BadgeDouble } from './BadgeDouble';
import { RiAlertFill, RiCheckboxCircleFill, RiHourglassLine } from '@remixicon/react';
const meta: Meta<typeof Badge> = {
  component: Badge,
  args: { title: 'Badge', variant: 'standard' },
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  render: (args) => (
    <div className="flex flex-col gap-12">
      <StoryWrapper title="Types">
        <div className="flex gap-12 flex-wrap">
          {typeVariants.map((type) => (
            <div key={type} className="flex flex-col items-center gap-4">
              <div className="capitalize text-sm text-grey-8 font-medium">
                {type}
              </div>
              <Badge {...args} type={type} />
            </div>
          ))}
        </div>
      </StoryWrapper>

      <Divider />

      <StoryWrapper title="Variants with types">
        <div className="flex gap-12 flex-wrap">
          {colorVariants.map((variant) => (
            <div key={variant} className="flex flex-col items-center gap-4">
              <div className="capitalize text-sm text-grey-8 font-medium">
                {variant}
              </div>
              {typeVariants.map((type) => (
                <Badge key={type} {...args} variant={variant} type={type} />
              ))}
            </div>
          ))}
        </div>
      </StoryWrapper>

      <Divider />

      <StoryWrapper title="Size">
        <div className="flex gap-8 flex-wrap">
          {sizeVariants.map((size) => (
            <div key={size} className="flex flex-col items-center gap-4">
              <div className="capitalize text-sm text-grey-8 font-medium">
                {size}
              </div>
              <Badge {...args} size={size} icon={<RiHourglassLine />} />
            </div>
          ))}
        </div>
      </StoryWrapper>

      <Divider />

      <StoryWrapper title="With icon">
        <div className="flex items-center gap-8 flex-wrap">
          <Badge {...args} icon={<RiAlertFill />} />
          <Badge {...args} icon={<RiHourglassLine />} iconPosition="left" />
          <Badge icon={<RiCheckboxCircleFill />} variant="success" />
        </div>
      </StoryWrapper>

      <Divider />

      <StoryWrapper title="With onClose">
        <div className="flex items-center gap-8 flex-wrap">
          <Badge
            {...args}
            icon={<RiHourglassLine />}
            iconPosition="left"
            onClose={action('onClose')}
          />
        </div>
      </StoryWrapper>

      <Divider />

      <StoryWrapper title="BadgeDouble">
        <div className="flex gap-12 flex-wrap">
          {colorVariants.map((variant) => (
            <div key={variant} className="flex flex-col items-center gap-4">
              <div className="capitalize text-sm text-grey-8 font-medium">
                {variant}
              </div>
              {typeVariants.map((type) => (
                <BadgeDouble
                  key={type}
                  variant={variant}
                  size="sm"
                  type={type}
                  badgeLeft={{
                    ...args,
                    iconPosition: 'left',
                    icon: <RiHourglassLine />,
                  }}
                  badgeRight={{
                    ...args,
                    icon: <RiCheckboxCircleFill />,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </StoryWrapper>
    </div>
  ),
};
