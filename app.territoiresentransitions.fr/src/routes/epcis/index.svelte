<script lang="ts">
    /**
     * Shows all Epcis.
     */
    import {EpciStorable} from "../../storables/EpciStorable";
    import {onMount} from "svelte";
    import {currentUtilisateurDroits} from "../../api/authentication";
    import {UtilisateurDroits} from "../../../../generated/models/utilisateur_droits";

    let allEpcis: EpciStorable[] = []
    let userEpcis: EpciStorable[] = []

    onMount(async () => {
        const stores = await import('../../api/hybridStores')
        const utilisateurDroits: UtilisateurDroits[] = await currentUtilisateurDroits()

        allEpcis = await stores.epciStore.retrieveAll()
        userEpcis = allEpcis.filter((epci) => utilisateurDroits.filter((droits) => droits.ecriture && droits.epci_id === epci.id))
    })
</script>

<div>
    <h2>Bienvenue !</h2>

    {#each userEpcis as epci}
        <p>
            {epci.nom}
            <br>
            <a href="/fiches/?epci_id={epci.uid}">Plan d'action</a>
            <br>
            <a href="/indicateurs/?epci_id={epci.uid}">Indicateurs</a>
        </p>
    {/each}
</div>

<div>
    <h2>Toutes les collectivités</h2>
    {#each allEpcis as epci}
        <p>
            {epci.nom}
            <br>
            <a href="/fiches/?epci_id={epci.uid}">Plan d'action</a>
            <br>
            <a href="/indicateurs/?epci_id={epci.uid}">Indicateurs</a>
        </p>
    {/each}
</div>
