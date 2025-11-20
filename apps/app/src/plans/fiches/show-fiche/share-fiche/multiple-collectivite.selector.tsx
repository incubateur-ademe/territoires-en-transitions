import { useTRPC } from '@/api/utils/trpc/client';
import { IdNameSchema } from '@/domain/collectivites';
import { Select, SelectProps } from '@/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

type MultipleCollectiviteSelectorProps = {
  collectivites?: IdNameSchema[] | null;
  onChange: (collectivites: IdNameSchema[]) => void;
} & Pick<SelectProps, 'placeholder'>;

export const MultipleCollectiviteSelector = (
  props: MultipleCollectiviteSelectorProps
) => {
  const { collectivites, onChange, ...selectProps } = props;
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const [isLoading, setIsLoading] = useState(false);
  const [collectiviteOptions, setCollectiviteOptions] = useState<
    { value: number; label: string }[]
  >([]);

  const onFilterCollectivites = async (
    search: string,
    collectivites?: { id: number; nom: string }[] | null
  ) => {
    // charge les collectivites
    if (isLoading) return;
    setIsLoading(true);

    const matchingCollectivites = await queryClient.ensureQueryData(
      trpc.collectivites.collectivites.list.queryOptions({
        text: search,
        limit: 20,
      })
    );

    const newCollectiviteOptions = matchingCollectivites.map((c) => ({
      value: c.id,
      label: c.nom ?? '',
    }));

    // Ajoute les collectivités partagées qui ne sont pas dans les options
    collectivites?.forEach((collectivite) => {
      if (
        !newCollectiviteOptions.some(
          (option) => option.value === collectivite.id
        )
      ) {
        newCollectiviteOptions.push({
          value: collectivite.id,
          label: collectivite.nom ?? '',
        });
      }
    });

    setIsLoading(false);

    setCollectiviteOptions(newCollectiviteOptions);
  };

  /**
   * To avoid a useEffect, see
   */
  const [prevCollectivites, setPrevCollectivites] = useState<
    IdNameSchema[] | null | undefined
  >(null);
  if (collectivites !== prevCollectivites) {
    setPrevCollectivites(collectivites);
    onFilterCollectivites('', collectivites);
  }

  return (
    <Select
      dataTest="select-collectivite"
      placeholder="Renseignez le nom de la collectivité"
      debounce={500}
      multiple
      maxBadgesToShow={3}
      options={collectiviteOptions}
      values={
        collectivites?.length
          ? collectivites?.map((collectivite) => collectivite.id)
          : undefined
      }
      isSearcheable
      onSearch={(search) => onFilterCollectivites(search, collectivites)}
      isLoading={isLoading}
      onChange={(value) => {
        if (!value) {
          return;
        }
        const newCollectivites = [...(collectivites || [])];
        const foundIndex = newCollectivites.findIndex((c) => c.id === value);
        if (foundIndex === -1) {
          newCollectivites.push({
            id: value as number,
            nom:
              collectiviteOptions.find((option) => option.value === value)
                ?.label || '',
          });
        } else {
          newCollectivites.splice(foundIndex, 1);
        }

        onChange(newCollectivites);
      }}
      {...selectProps}
    />
  );
};
