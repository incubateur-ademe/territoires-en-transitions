import { mergeTests } from '@playwright/test';
import { testWithCollectivites } from './collectivite/collectivites.fixture';
import { testWithDiscussions } from './collectivite/discussions/discussions.fixture';
import { testWithPersonneTags } from './collectivite/tags/personne-tags.fixture';
import { testWithIndicateurs } from './indicateurs/indicateurs.fixture';
import { testWithFiches } from './plans/fiches/fiches.fixture';
import { testWithPlans } from './plans/plans/plans.fixture';
import { testWithReferentiels } from './referentiels/referentiels.fixture';

export const test = mergeTests(
  testWithCollectivites,
  testWithPersonneTags,
  testWithDiscussions,
  testWithPlans,
  testWithFiches,
  testWithIndicateurs,
  testWithReferentiels
);
