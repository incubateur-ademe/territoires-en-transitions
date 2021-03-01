<script lang="typescript">
	import MesureLink from './shared/MesureLink.svelte'
  import {getAllCustomMesures} from '../api/customMesure'

  export let climat_pratic_thematique

  let customMesures

  const updateMesures = () => {
	  customMesures = getAllCustomMesures(climat_pratic_thematique)
  }

  updateMesures()
</script>

<ul>
{#each Object.values(customMesures) as mesure}
	<MesureLink
    on:delete={updateMesures}
    value={mesure.id}
    id={mesure.id}
    name={mesure.name}
  />
{/each}
</ul>
