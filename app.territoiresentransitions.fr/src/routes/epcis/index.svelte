<script lang="ts">
    /**
     * Shows all Epcis.
     */
    import {EpciStorable} from "../../storables/EpciStorable";
    import {onMount} from "svelte";
    import {currentUtilisateurDroits} from "../../api/authentication";
    import {UtilisateurDroits} from "../../../../generated/models/utilisateur_droits";
    import Card from "./_EpciCard.svelte"

    let allEpcis: EpciStorable[] = []
    let userEpcis: EpciStorable[] = []

    onMount(async () => {
        const stores = await import('../../api/hybridStores')
        const utilisateurDroits: UtilisateurDroits[] = await currentUtilisateurDroits()

        allEpcis = await stores.epciStore.retrieveAll()
        userEpcis = allEpcis.filter((epci) => utilisateurDroits.filter((droits) => droits.ecriture && droits.epci_id === epci.id))
    })


</script>

<div class="pb-5"></div>
<div>
    <h2 class="text-3xl text-center">Bienvenue !</h2>
    <div class="pb-5"></div>

    <div class="grid grid-cols-4 gap-4">
        {#each userEpcis as epci}
            <Card epci={epci} writable/>
        {/each}
    </div>
</div>

<div class="pb-5"></div>
<div>
    <h2 class="text-3xl text-center">Consulter les autres collectivités</h2>
    <div class="pb-5"></div>
    <div class="grid grid-cols-4 gap-4">
        {#each allEpcis as epci}
            <Card epci={epci}/>
        {/each}
    </div>
</div>
