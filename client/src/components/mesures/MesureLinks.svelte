<script lang="typescript">
    import MesureLink from './MesureLink.svelte';
    import {mesureCustomStore} from "../../api/hybridStore";
    import {MesureCustomStorable} from "../../storables/MesureCustomStorable";

    export let climat_pratic_thematique_id
    let customMesures: Array<MesureCustomStorable> = []

    const updateMesures = async () => {
        const all = await mesureCustomStore.retrieveAll()
        customMesures = all.filter(
            (mesure) => mesure.climat_pratic_thematic_id == climat_pratic_thematique_id
        )
    }

    updateMesures()
</script>

<ul>
    {#each customMesures as mesure}
        <MesureLink
                on:delete={updateMesures}
                mesure={mesure}
        />
    {/each}
</ul>
