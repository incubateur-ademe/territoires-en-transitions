<script lang="ts">
    /**
     * Shows all Epcis.
     */
    import {EpciStorable} from "../../storables/EpciStorable";
    import {onMount} from "svelte";
    import {currentUtilisateurDroits} from "../../api/authentication";
    import {UtilisateurDroits} from "../../../../generated/models/utilisateur_droits";
    import Card from "./_EpciCard.svelte"
    import AddDialog from "./_AddDialog.svelte"
    import Button from "../../components/shared/Button/Button.svelte";

    let allEpcis: EpciStorable[] = []
    let userEpcis: EpciStorable[] = []
    let showAddDialog: boolean = true

    onMount(async () => {
        const stores = await import('../../api/hybridStores')
        const utilisateurDroits: UtilisateurDroits[] = await currentUtilisateurDroits()

        allEpcis = await stores.epciStore.retrieveAll()
        userEpcis = allEpcis.filter((epci) => {
            return utilisateurDroits.filter((droits) => {
                return droits.ecriture && droits.epci_id === epci.id;
            }).length > 0;
        })
    })
</script>

<div class="pb-5"></div>
<div>
    <h2 class="text-3xl text-center">Bienvenue !</h2>
    <div class="pb-5"></div>

    <div class="grid grid-cols-4 gap-4">
        <div class="shadow-sm bg-white p-2">
            <h3 class="text-3xl">...</h3>
            <Button on:click={() => showAddDialog = true}>Ajouter une collectivité</Button>
        </div>

        {#each userEpcis as epci}
            <Card epci={epci} writable/>
        {/each}
    </div>
</div>


{#if showAddDialog}
    <AddDialog epcis={allEpcis}/>
{/if}

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
