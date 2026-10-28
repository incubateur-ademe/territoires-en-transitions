'use client';

import { Card, PageHeader, Stack } from '@tet/ui';
import { prototypes } from '../src/prototypes';

export default function PrototypesPage() {
  return (
    <Stack gap="lg">
      <PageHeader>
        <PageHeader.Title>Prototypes</PageHeader.Title>
      </PageHeader>
      <Stack as="ul" gap="md">
        {prototypes.map(({ slug, titre, description }) => (
          <li key={slug}>
            <Card href={`/${slug}`} header={titre}>
              <span className="text-sm font-normal text-grey-8">
                {description}
              </span>
            </Card>
          </li>
        ))}
      </Stack>
    </Stack>
  );
}
