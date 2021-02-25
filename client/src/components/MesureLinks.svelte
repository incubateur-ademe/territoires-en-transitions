<script lang="typescript">
	import MesureLink from './shared/MesureLink.svelte'
  import {getAllCustomMesures} from '../api/customMesure'

  export let climat_pratic_thematique

  const mesures = getAllCustomMesures(climat_pratic_thematique)
</script>

<ul>
{#each Object.values(mesures) as mesure}
	<MesureLink id={mesure.id} name={mesure.name} />
{/each}
</ul>
