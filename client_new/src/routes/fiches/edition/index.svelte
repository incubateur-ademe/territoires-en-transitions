<script lang="ts">
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../../api/currentEpci";
    import {FicheActionInterface} from "../../../../../generated/models/fiche_action";
    import Form from "../_Form"
    import {FicheActionStorable} from "../../../storables/FicheActionStorable";
    import Button from "../../../components/shared/Button/Button.svelte";
    import {HybridStore} from "../../../api/hybridStore";

    let data: FicheActionInterface
    let id: string
    let ficheActionStore: HybridStore<FicheActionStorable>

    onMount(async () => {
        const epci_id = getCurrentEpciId()

        const hybridStores = await import ("../../../api/hybridStores");
        ficheActionStore = hybridStores.ficheActionStore;

        const urlParams = new URLSearchParams(window.location.search)
        const uid = urlParams.get('uid')
        id = FicheActionStorable.buildId(epci_id, uid)

        data = await ficheActionStore.retrieveById(id)
    });


    const handleDelete = async (event) => {
        event.preventDefault()

        const confirmDelete =
            confirm('Êtes-vous sûr•e de vouloir supprimer une de vos actions personnalisées ?')

        if (confirmDelete) {
            await ficheActionStore.deleteById(id)
            window.location.href = `/fiches/?epci_id=${data.epci_id}`
        }
    }

</script>


<svelte:head>
    <title>Ma fiche action</title>
</svelte:head>

<div class="bg-white p-4">
    <header class="flex py-10">
        <h1 class="text-3xl font-semibold  flex-grow">Ma fiche action</h1>
        <Button classNames=""
                colorVariant="bramble"
                label="Supprimer"
                on:click={handleDelete}
                size="small"
        />
    </header>
    <div class="p-5"></div>


    {#if data}
        <Form data="{data}"/>
    {/if}
</div>
