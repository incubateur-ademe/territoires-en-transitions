'use client';

import { Button, Field, Select } from '@/ui';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import { supabase } from '../initSupabase';

/**
 * Toutes les régions.
 */
function useRegion() {
  return useSWR('region', async () => {
    const { data, error } = await supabase.from('region').select();
    if (error) {
      throw new Error(error.message);
    }
    return data ? data : null;
  });
}

/**
 * Les départements filtrables par code région.
 *
 * @param regionCode le code région ou une chaine vide.
 */
function useDepartment(regionCode: string) {
  return useSWR(`departement-${regionCode}`, async () => {
    let select = supabase.from('departement').select();
    if (regionCode) select = select.eq('region_code', regionCode);
    const { data, error } = await select;
    if (error) {
      throw new Error(error.message);
    }
    return data ? data : null;
  });
}

const emptyString = '';

/**
 * Filtre de la page statistiques, par région et par département
 *
 * @param onChange - Renvoie au composant parent le nom du nouvel élément sélectionné
 */

type RegionAndDeptFiltersProps = {
  onChange: (value: string | null) => void;
};

const RegionAndDeptFilters = ({ onChange }: RegionAndDeptFiltersProps) => {
  const router = useRouter();
  const pathName = usePathname() ?? '';

  const [selectedRegion, setSelectedRegion] = useState<string>(emptyString);
  const [selectedDepartment, setSelectedDepartment] =
    useState<string>(emptyString);

  const regions = useRegion().data;
  const departments = useDepartment(selectedRegion).data;

  const changeDepartmentName = () => {
    const newDepartment = departments?.find(
      (dept) => dept.code === selectedDepartment
    );
    onChange(newDepartment?.libelle ?? null);
  };

  const changeRegionName = () => {
    const newRegion = regions?.find((region) => region.code === selectedRegion);
    onChange(newRegion?.libelle ?? null);
  };

  useEffect(() => {
    // Mise à jour des states selectedDepartment et selectedRegion
    // + du titre lors du changement d'url
    const pathArray = pathName.split('/');

    if (pathArray.length === 2 && pathArray[1] === 'stats') {
      setSelectedDepartment(emptyString);
      setSelectedRegion(emptyString);
      onChange(null);
    } else if (pathArray.length === 4 && pathArray[1] === 'stats') {
      if (pathArray[2] === 'region') {
        setSelectedRegion(pathArray[3]);
        setSelectedDepartment(emptyString);
      } else if (pathArray[2] === 'departement') {
        setSelectedDepartment(pathArray[3]);
      }
    }
  }, [pathName, onChange]);

  useEffect(() => {
    // Permet la mise à jour du titre quand l'url
    // est mis à jour manuellement
    // (enclenche le rechargement de regions et departements)
    if (selectedDepartment) changeDepartmentName();
    else if (selectedRegion) changeRegionName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regions, departments]);

  useEffect(() => {
    // Redirige vers la nouvelle page stats quand
    // selectedDepartment est modifié
    if (selectedDepartment) {
      changeDepartmentName();
      router.push(`/stats/departement/${selectedDepartment}`);
    } else {
      if (selectedRegion) {
        changeRegionName();
        router.push(`/stats/region/${selectedRegion}`);
      } else router.push(`/stats/`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepartment, router]);

  useEffect(() => {
    // Redirige vers la nouvelle page stats quand
    // selectedRegion est modifié
    if (selectedRegion) {
      changeRegionName();
      router.push(`/stats/region/${selectedRegion}`);
    } else router.push(`/stats/`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion, router]);

  if (!regions || !departments) return null;

  return (
    <>
      {selectedDepartment || selectedRegion ? (
        <p className="paragraphe-22">
          Cette page présente les statistiques de déploiement et d’usage{' '}
          {selectedDepartment ? 'départementales' : 'régionales'} de la
          plateforme Territoires en Transitions.
        </p>
      ) : (
        <p className="paragraphe-22">
          Territoires en Transitions est une plateforme publique gratuite et
          open-source développée avec ses utilisateurs afin d’aider les
          collectivités dans le pilotage et la priorisation de leur transition
          écologique.
        </p>
      )}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-x-[50px] gap-y-5 justify-items-start items-end">
        <Field title="Région" className="w-full">
          <Select
            placeholder="Toutes les régions"
            options={regions
              .filter((region) => region.code && region.libelle)
              .map((region) => ({
                value: region.code!,
                label: region.libelle!,
              }))}
            values={selectedRegion || undefined}
            onChange={(value) =>
              setSelectedRegion(value?.toString() || emptyString)
            }
          />
        </Field>
        <Field title="Département" className="w-full">
          <Select
            placeholder="Tous les départements"
            options={departments
              .filter((department) => department.code && department.libelle)
              .map((department) => ({
                value: department.code!,
                label: department.libelle!,
              }))}
            values={selectedDepartment || undefined}
            onChange={(value) =>
              setSelectedDepartment(value?.toString() || emptyString)
            }
          />
        </Field>

        <Button
          variant="outlined"
          onClick={() => {
            setSelectedRegion(emptyString);
            setSelectedDepartment(emptyString);
          }}
          style={{
            visibility:
              selectedDepartment || selectedRegion ? 'visible' : 'hidden',
          }}
        >
          Désactiver tous les filtres
        </Button>
      </div>
    </>
  );
};

export default RegionAndDeptFilters;
