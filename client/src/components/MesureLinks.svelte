<script lang="typescript">
	import MesureLink from './shared/MesureLink.svelte'
  import {getAllCustomMesures} from '../api/customMesure'

  const mesures = getAllCustomMesures()
</script>

<ul>
{#each Object.values(mesures) as mesure}
	<MesureLink id={mesure.id} name={mesure.name} />
{/each}
</ul>
