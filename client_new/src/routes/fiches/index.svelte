<script lang="ts">
    import Button from "../../components/shared/Button.svelte";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import Title from "../../components/shared/Title.svelte";
    import {FicheActionStorable} from "../../storables/FicheActionStorable";
    import {ficheActionStore} from "../../api/localStore";

    let epciId = ''
    let fiches: Array<FicheActionStorable> = []

    const updateActions = async () => {
        fiches = await ficheActionStore.retrieveAll()
    }

    onMount(async () => {
        epciId = getCurrentEpciId()
        await updateActions()
    });
</script>
<svelte:head>
    <title>Mes fiches actions</title>
</svelte:head>

<header class="flex my-10">
    <h1 class="text-3xl font-semibold  flex-grow">Mes fiches actions</h1>
    <Button asLink
            label="Créer une nouvelle fiche"
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

