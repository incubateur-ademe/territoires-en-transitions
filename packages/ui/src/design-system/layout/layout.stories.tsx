import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ReactNode } from 'react';
import { Box } from './box';
import { Grid } from './grid';
import { Inline } from './inline';
import { Stack } from './stack';

const meta: Meta = {
  title: 'Design System/Layout',
  parameters: {
    docs: {
      description: {
        component:
          "Primitives de layout : le parent possède l'espacement. `Stack`, `Inline` et `Grid` espacent leurs enfants avec `gap`, `Box` porte le padding. Échelle : none (0) · xs (4px) · sm (8px) · md (16px) · lg (24px) · xl (32px). Toutes les props acceptent une valeur par point de rupture : `gap={{ base: 'sm', lg: 'md' }}`.",
      },
    },
  },
};

export default meta;

type Story = StoryObj;

const Item = ({ children }: { children: ReactNode }) => (
  <div className="rounded border border-primary-3 bg-primary-1 px-3 py-2 text-sm text-primary-9">
    {children}
  </div>
);

const items = (count: number) =>
  Array.from({ length: count }, (_, index) => (
    <Item key={index}>Élément {index + 1}</Item>
  ));

export const StackSpacings: Story = {
  name: 'Stack — échelle',
  render: () => (
    <Inline gap="xl" align="start">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((gap) => (
        <Stack key={gap} gap="xs">
          <span className="text-xs font-bold text-grey-8">{gap}</span>
          <Stack gap={gap}>{items(3)}</Stack>
        </Stack>
      ))}
    </Inline>
  ),
};

export const InlineJustify: Story = {
  name: 'Inline — justification et repli',
  render: () => (
    <Stack gap="lg">
      <Inline justify="between" align="center">
        <Item>Titre</Item>
        <Inline gap="xs">{items(2)}</Inline>
      </Inline>
      <Inline collapseBelow="md" gap="md">
        {items(3)}
      </Inline>
    </Stack>
  ),
};

export const GridResponsive: Story = {
  name: 'Grid — colonnes responsives',
  render: () => (
    <Grid as="ul" columns={{ base: 1, md: 2, lg: 3 }}>
      {items(6).map((item) => (
        <li key={item.key}>{item}</li>
      ))}
    </Grid>
  ),
};

export const PageComposition: Story = {
  name: 'Composition de page',
  render: () => (
    <Stack gap="lg">
      <Inline justify="between" align="center" collapseBelow="md">
        <h1 className="mb-0 text-2xl">Plans d’action</h1>
        <Inline gap="xs">{items(2)}</Inline>
      </Inline>
      <Grid columns={{ base: 1, lg: 3 }}>
        <Box
          as="section"
          padding="md"
          className="rounded-lg border border-grey-3 bg-white"
        >
          <Stack gap="sm">{items(3)}</Stack>
        </Box>
        <Box
          as="section"
          padding="md"
          className="rounded-lg border border-grey-3 bg-white lg:col-span-2"
        >
          <Stack gap="sm">{items(2)}</Stack>
        </Box>
      </Grid>
    </Stack>
  ),
};
