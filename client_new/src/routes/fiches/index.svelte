<script lang="ts">
    import Button from "../../components/shared/Button.svelte";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import {FicheActionStorable} from "../../storables/FicheActionStorable";
    import {HybridStore} from "../../api/hybridStore";


    let epciId = ''
    let fiches: Array<FicheActionStorable> = []
    let ficheActionStore: HybridStore<FicheActionStorable>

    const updateActions = async () => {
        let retrieved = await ficheActionStore.retrieveAll()
        fiches = retrieved.sort((a, b) => a.custom_id.localeCompare(b.custom_id))
    }

    onMount(async () => {
        epciId = getCurrentEpciId()
        const hybridStores = await import ("../../api/hybridStores");
        ficheActionStore = hybridStores.ficheActionStore;
        await updateActions()
    });
</script>
<svelte:head>
    <title>Plan d'actions</title>
</svelte:head>

<header class="flex my-10">
    <h1 class="text-3xl font-semibold  flex-grow">Plan d'actions de ma collectivité oqiwpdiqwopi</h1>
    <Button asLink
            label="Créer une fiche action"
            href="fiches/creation/?epci_id={epciId}"/>
</header>
<div class="p-5"></div>

<ul>
    {#each fiches as fiche}
        <li>
            <a class="bg-white p-4 rounded my-4 grid grid-cols-1 lg:grid-cols-12 lg:gap-1"
               href="fiches/edition/?epci_id={epciId}&uid={fiche.uid}">
                <h3 class="lg:col-span-8 text-xl font-semibold mb-6 pr-28">
                    ({fiche.custom_id}) {fiche.titre}
                </h3>
            </a>
        </li>
    {/each}
</ul>
<div class="p-5"></div>

