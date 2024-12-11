import { useRef } from 'react';

import { FicheAction } from '@tet/api/plan-actions';

import { Checkbox } from '@tet/ui';
import SpinnerLoader from 'ui/shared/SpinnerLoader';

import { Etape, Textarea, useUpsertEtape } from './etape';
import { useGetEtapes } from './use-get-etapes';

type Props = {
  fiche: FicheAction;
  isReadonly: boolean;
};

const Etapes = ({ fiche, isReadonly }: Props) => {
  const { data, isLoading } = useGetEtapes({ id: fiche.id });

  const { mutate: createEtape } = useUpsertEtape();

  const etapes = data ?? [];

  const etapesRealiseesCount = etapes.filter((etape) => etape.realise).length;

  const createRef = useRef<HTMLTextAreaElement>(null);

  const handleCreateEtape = (newTitle: string) => {
    if (newTitle.length) {
      createEtape({
        ficheId: fiche.id,
        ordre: etapes.length + 1,
        nom: newTitle,
      });
      if (createRef.current) {
        createRef.current.focus();
      }
    }
  };

  /** État de chargement */
  if (isLoading) {
    return (
      <div className="h-80 w-full flex justify-center items-center">
        <SpinnerLoader />
      </div>
    );
  }

  /** Liste des étapes */
  return (
    <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8">
      <h5 className="mb-3 text-primary-8">
        Étapes {etapes.length > 0 && `${etapesRealiseesCount}/${etapes.length}`}
      </h5>
      <p className="mb-0 text-sm text-grey-6">
        Décomposer une action en étapes distinctes afin de suivre son
        avancement.
      </p>
      <div className="h-[1px] w-full my-4 bg-grey-3" />
      <div className="flex flex-col gap-1">
        {etapes.map((etape) => (
          <Etape key={etape.id} etape={etape} isReadonly={isReadonly} />
        ))}
      </div>
      {/** Champ d'ajout d'une nouvelle étape */}
      {!isReadonly && (
        <div className="flex items-start p-4">
          <Checkbox />
          <Textarea
            ref={createRef}
            placeholder="Ajouter une étape"
            disabled={isReadonly}
            onBlur={handleCreateEtape}
          />
        </div>
      )}
    </div>
  );
};

export default Etapes;
