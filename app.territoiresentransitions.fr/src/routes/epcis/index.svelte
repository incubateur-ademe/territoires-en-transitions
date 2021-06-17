<script lang="ts">
    /**
     * Shows all Epcis.
     */
    import {EpciStorable} from "../../storables/EpciStorable";
    import {onMount} from "svelte";
    import {currentUtilisateurDroits} from "../../api/authentication";
    import {UtilisateurDroits} from "../../../../generated/models/utilisateur_droits";
    import Button from "../../components/shared/Button/Button.svelte";

    let allEpcis: EpciStorable[] = []
    let userEpcis: EpciStorable[] = []

    onMount(async () => {
        const stores = await import('../../api/hybridStores')
        const utilisateurDroits: UtilisateurDroits[] = await currentUtilisateurDroits()

        allEpcis = await stores.epciStore.retrieveAll()
        userEpcis = allEpcis.filter((epci) => utilisateurDroits.filter((droits) => droits.ecriture && droits.epci_id === epci.id))
    })

    const gotoFiches = (epciId) => {
        window.location.href = `fiches/?epci_id=${epciId}`
    }

    const gotoIndicateurs = (epciId) => {
        window.location.href = `indicateurs/?epci_id=${epciId}`
    }
</script>

<div>
    <h2>Bienvenue !</h2>

    {#each userEpcis as epci}
        <p>
            {epci.nom}
            <br>
            <Button on:click={gotoFiches(epci.uid)}>Plan d'action</Button>
            <Button on:click={gotoIndicateurs(epci.uid)}>Indicateurs</Button>
        </p>
    {/each}
</div>

<div>
    <h2>Toutes les collectivités</h2>
    {#each allEpcis as epci}
        <p>
            {epci.nom}
            <br>
            <Button on:click={gotoFiches(epci.uid)}>Plan d'action</Button>
            <Button on:click={gotoIndicateurs(epci.uid)}>Indicateurs</Button>
        </p>
    {/each}
</div>
