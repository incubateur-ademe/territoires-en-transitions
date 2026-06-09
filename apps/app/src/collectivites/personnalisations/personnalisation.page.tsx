import { Card } from '@tet/ui';
import { OpenedThematiquesProvider } from './data/use-list-opened-thematiques';
import { PersonnalisationFiltersProvider } from './filters/personnalisation-filters-context';
import { PersonnalisationThematiquesList } from './personnalisation-thematiques.list';
import { PersonnalisationHeader } from './personnalisation.header';

export const PersonnalisationPage = () => {
  return (
    <PersonnalisationFiltersProvider>
      <OpenedThematiquesProvider>
        <Card header={<PersonnalisationHeader />}>
          <PersonnalisationThematiquesList />
        </Card>
      </OpenedThematiquesProvider>
    </PersonnalisationFiltersProvider>
  );
};
