'use client';

import useSWR from 'swr';
import {supabase} from '../initSupabase';
import {useEffect, useRef, useState} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import Select from '../Select';

const usePrevious = (value: any) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

/**
 * Toutes les régions.
 */
function useRegion() {
  return useSWR('region', async () => {
    const {data, error} = await supabase.from('region').select();
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
    const {data, error} = await select;
    if (error) {
      throw new Error(error.message);
    }
    return data ? data : null;
  });
}

const initState = (pathName: string, stateName: string): string => {
  const pathArray = pathName.split('/');
  if (pathArray.length === 4) {
    if (
      (pathArray[2] === 'region' && stateName === 'selectedRegion') ||
      (pathArray[2] === 'departement' && stateName === 'selectedDepartment')
    ) {
      return pathArray[3];
    }
  }
  return emptyString;
};

const emptyString = '';

const RegionAndDeptFilters = () => {
  const router = useRouter();
  const pathName = usePathname() ?? '';

  const [selectedRegion, setSelectedRegion] = useState<string>(
    initState(pathName, 'selectedRegion')
  );
  const [selectedDepartment, setSelectedDepartment] = useState<string>(
    initState(pathName, 'selectedDepartment')
  );

  const prevSelectedDepartment = usePrevious(selectedDepartment);

  const regions = useRegion().data;
  const departments = useDepartment(selectedRegion).data;

  useEffect(() => {
    if (
      selectedDepartment !== emptyString &&
      selectedDepartment !== prevSelectedDepartment
    ) {
      router.push(`/stats/departement/${selectedDepartment}`);
    } else if (selectedRegion !== emptyString) {
      setSelectedDepartment(emptyString);
      router.push(`/stats/region/${selectedRegion}`);
    } else if (
      selectedRegion === emptyString &&
      selectedDepartment === emptyString
    ) {
      router.push('/stats');
    }
  }, [selectedDepartment, selectedRegion]);

  if (!regions || !departments) return null;

  return (
    <div
      className="fr-select-group"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        columnGap: '50px',
        rowGap: '20px',
        justifyItems: 'start',
        alignItems: 'end',
      }}
    >
      <Select
        name="region"
        label="Région"
        emptyOptionLabel="Toutes les régions"
        options={regions.map(region => ({
          value: region.code,
          name: region.libelle,
        }))}
        value={selectedRegion}
        style={{width: '100%'}}
        onChange={setSelectedRegion}
      />

      <Select
        name="department"
        label="Département"
        emptyOptionLabel="Tous les départements"
        options={departments.map(department => ({
          value: department.code,
          name: department.libelle,
        }))}
        value={selectedDepartment}
        style={{width: '100%'}}
        onChange={setSelectedDepartment}
      />

      <button
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
      </button>
    </div>
  );
};

export default RegionAndDeptFilters;
