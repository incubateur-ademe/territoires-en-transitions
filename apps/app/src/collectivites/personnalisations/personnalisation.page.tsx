import { Card } from '@tet/ui';
import { PersonnalisationFiltersProvider } from './filters/personnalisation-filters-context';
import { PersonnalisationThematiquesList } from './personnalisation-thematiques.list';
import { PersonnalisationHeader } from './personnalisation.header';

export const PersonnalisationPage = () => {
  return (
    <PersonnalisationFiltersProvider>
      <Card header={<PersonnalisationHeader />}>
        <PersonnalisationThematiquesList />
      </Card>
    </PersonnalisationFiltersProvider>
  );
};
