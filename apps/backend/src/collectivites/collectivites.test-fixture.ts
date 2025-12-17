import { withOnTestFinished } from '../utils/test-fixture.utils';
import { createGroupement as createGroupementBase } from './shared/models/groupement.fixture';
import { createCategorieTag as createCategorieTagBase } from './tags/categorie-tag.fixture';
import { createPersonneTag as createPersonneTagBase } from './tags/personnes/personne-tag.fixture';
import { createServiceTag as createServiceTagBase } from './tags/service-tag.fixture';

export const createPersonneTag = withOnTestFinished(createPersonneTagBase);
export const createServiceTag = withOnTestFinished(createServiceTagBase);
export const createCategorieTag = withOnTestFinished(createCategorieTagBase);
export const createGroupement = withOnTestFinished(createGroupementBase);
