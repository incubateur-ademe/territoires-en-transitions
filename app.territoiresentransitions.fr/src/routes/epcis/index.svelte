<script lang="ts">
    /**
     * Shows all Epcis.
     */
    import type {EpciStorable} from "$storables/EpciStorable";
    import {onMount} from "svelte";
    import {currentUtilisateurDroits} from "$api/authentication";
    import type {UtilisateurDroits} from "$generated/models/utilisateur_droits";
    import AddDialog from "./_AddDialog.svelte"
    import Card from "./_EpciCard.svelte"
    import {raf} from "svelte/internal";

    let allEpcis: EpciStorable[] = []
    let userEpcis: EpciStorable[] = []
    let showAddDialog: boolean = false

    const fetch = async () => {
        const stores = await import('$api/hybridStores')
        const utilisateurDroits: UtilisateurDroits[] = await currentUtilisateurDroits()

        const all = await stores.epciStore.retrieveAll()
        allEpcis = all.sort((a, b) => a.nom > b.nom ? 1 : -1)
        userEpcis = allEpcis.filter((epci) => {
            return utilisateurDroits.filter((droits) => {
                return droits.ecriture && droits.epci_id === epci.id
            }).length > 0
        })
    }

    const handleDialogClose = async () => {
        await fetch()
        await setTimeout(() => showAddDialog = false, 32);
    }

    onMount(fetch)
</script>

<style>
    section + section {
        margin-top: 11.25rem;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-gap: 3rem;
    }

    .card {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem 1.5rem 1.125rem;
        background-color: var(--beige);
        border-bottom: 4px solid var(--bf500);
    }

    h1,
    h2 {
        text-align: center;
    }

    h1 {
        margin-bottom: 3.75rem;
    }

    h2 {
        margin-bottom: 4.5rem;
    }
</style>

<section>
    <h1 class="fr-h1">Bienvenue !</h1>

    <h2 class="fr-h2">Vos collectivités</h2>

    <div class="grid">
        {#each userEpcis as epci}
            <Card epci={epci} writable/>
        {/each}

        <div class="card">
            <h3 class="fr-h3">…</h3>
            <button class="fr-btn fr-btn--sm" on:click|preventDefault={() => showAddDialog = !showAddDialog}>Ajouter ma
                collectivité
            </button>
        </div>
    </div>
</section>

<section>
    <h2 class="fr-h2">Consulter les autres collectivités</h2>

    <div class="grid">
        {#each allEpcis as epci}
            <Card epci={epci}/>
        {/each}
    </div>
</section>


{#if showAddDialog}
    <AddDialog epcis={allEpcis}
               on:AddDialogClose={handleDialogClose}
    />
{/if}