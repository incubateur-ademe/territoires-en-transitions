import { Tag } from '@tet/domain/collectivites';
import { EffetAttendu, SousThematique, Thematique } from '@tet/domain/shared';

export type DescriptionFormValues = {
  description: string | null;
  objectifs: string | null;
  effetsAttendus: EffetAttendu[] | null;
  thematiques: Thematique[] | null;
  sousThematiques: SousThematique[] | null;
  libreTags: Tag[] | null;
};
