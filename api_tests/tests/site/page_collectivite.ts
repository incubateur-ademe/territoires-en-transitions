import {supabase} from '../../lib/supabase.ts';
import {
  assertExists,
} from 'https://deno.land/std@0.196.0/assert/assert_exists.ts';
import {Database} from '../../lib/database.types.ts';

await new Promise((r) => setTimeout(r, 0));

type labellisations = Database['public']['Tables']['labellisation']['Row']
type indicateurs = Database['public']['Tables']['indicateur_resultat_import']['Row']

Deno.test(
  'Données de labellisation historiques',
  // ignoré, car le seed ne contient pas les données de labellisation.
  {ignore: true},
  async () => {
    const {data, error} = await supabase.from('site_labellisation').
      select('*, labellisations').
      eq('collectivite_id', 3127);
    assertExists(data);
    assertExists(data[0].labellisations as labellisations);
  },
);

Deno.test(
  'Indicateurs gaz effet de serre.',
  // ignoré, car le seed ne contient pas les données.
  {ignore: true},
  async () => {
    const {data, error} = await supabase.from('site_labellisation').
      select('*, indicateurs_gaz_effet_serre').
      eq('collectivite_id', 189);
    assertExists(data);
    assertExists(data[0].indicateurs_gaz_effet_serre as indicateurs);
  },
);

Deno.test(
  'Indicateurs gaz effet de serre et de labellisation.',
  // ignoré, car le seed ne contient pas les données.
  {ignore: true},
  async () => {
    const {data, error} = await supabase.from('site_labellisation').
      select('*, labellisations, indicateurs_gaz_effet_serre').
      eq('collectivite_id', 189);
    assertExists(data);
    assertExists(data[0].labellisations as labellisations);
    assertExists(data[0].indicateurs_gaz_effet_serre as indicateurs);
  },
);

Deno.test(
  'Indicateurs gaz effet de serre.',
  // ignoré, car le seed ne contient pas les données.
  {ignore: true},
  async () => {
    const {data, error} = await supabase.from('site_labellisation').
      select('*, indicateur_artificialisation').
      eq('collectivite_id', 189);
    assertExists(data);
    assertExists(data[0].indicateur_artificialisation as indicateurs);
  },
);
