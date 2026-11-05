import { appLabels } from '@/app/labels/catalog';
import { DetailedAction } from '@/app/ui/detailed-action/detailed-action.layout';
import { capitalize } from '@tet/ui/labels/plural';
import { useFicheContext } from '../../context/fiche-context';
import { Acteurs } from './acteurs';
import { Description } from './description';
import { FormSection } from './form-section.card';
import { Jauge } from './jauge';
import { Planning } from './planning';

export const DetailsView = () => {
  const { fiche } = useFicheContext();
  const isFicheParente = fiche.parentId === null;

  return (
    <DetailedAction.Root>
      <DetailedAction.Main>
        <FormSection>
          <Description />
        </FormSection>
      </DetailedAction.Main>
      <DetailedAction.Aside>
        {isFicheParente && <Jauge />}
        <FormSection title="Calendrier">
          <Planning />
        </FormSection>
        <FormSection title={capitalize(appLabels.acteur({ plural: true }))}>
          <Acteurs />
        </FormSection>
      </DetailedAction.Aside>
    </DetailedAction.Root>
  );
};
