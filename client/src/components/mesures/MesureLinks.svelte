<script lang="typescript">
    import MesureLink from './MesureLink.svelte';
    import {mesureCustomStore} from "../../api/localStore";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import {MesureCustomStorable} from "../../storables/MesureCustomStorable";

    export let climat_pratic_thematique_id
    const epciId = getCurrentEpciId()
    let customMesures: Array<MesureCustomStorable>

    const updateMesures = () => {
        customMesures = mesureCustomStore.where(
            (mesure) => mesure.climat_pratic_thematic_id == climat_pratic_thematique_id &&
                mesure.epci_id == epciId
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
