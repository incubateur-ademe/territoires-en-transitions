'use client';

import useSWR from 'swr';
import {supabase} from '../initSupabase';
import {useEffect, useState} from 'react';
import {redirect} from 'next/navigation';
import Select from '../Select';

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

const emptyString = '';

const RegionAndDeptFilters = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>(emptyString);
  const [selectedDepartment, setSelectedDepartment] =
    useState<string>(emptyString);

  const regions = useRegion().data;
  const departments = useDepartment(selectedRegion).data;

  useEffect(() => {
    if (selectedDepartment !== emptyString) {
      redirect(`/stats/departement/${selectedDepartment}`);
    } else if (selectedRegion !== emptyString) {
      redirect(`/stats/region/${selectedRegion}`);
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
