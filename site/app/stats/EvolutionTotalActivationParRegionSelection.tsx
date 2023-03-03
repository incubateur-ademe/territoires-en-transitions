'use client';

import useSWR from 'swr';
import {supabase} from '../initSupabase';
import EvolutionTotalActivationParType
  from './EvolutionTotalActivationParType.tsx';
import {useState} from 'react';

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
function useDepartement(regionCode: string) {
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
export default function EvolutionTotalActivationParRegionSelection() {
  const [selectedRegion, setSelectedRegion] = useState<string>(emptyString);
  const [selectedDepartement, setSelectedDepartement] = useState<string>(emptyString);
  const regions = useRegion().data;
  const departements = useDepartement(selectedRegion).data;

  if (!regions || !departements) return null;

  return (
    <section>
      <h3>Stats régionales</h3>
      <div className="fr-select-group">
        <label className="fr-label" htmlFor="region">
          Région
        </label>
        <select onChange={e => setSelectedRegion(e.target.value)}
                value={selectedRegion}
                class="fr-select" id="region" name="region">
          <option value={emptyString}
                  key="none">Toutes
          </option>
          {regions.map((region) => (
            <option value={region.code}
                    key={region.code}>{region.libelle}</option>
          ))}
        </select>
        <label className="fr-label" htmlFor="departement">
          Département
        </label>
        <select onChange={e => setSelectedDepartement(e.target.value)}
                value={selectedDepartement}
                class="fr-select" id="departement" name="departement">
          <option value={emptyString}
                  key="none">Tous
          </option>
          {departements.map((departement) => (
            <option value={departement.code}
                    key={departement.code}>{departement.libelle}</option>
          ))}
        </select>
      </div>
      <EvolutionTotalActivationParType region={selectedRegion} departement={selectedDepartement} />
    </section>
  );
}
