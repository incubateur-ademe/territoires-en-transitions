<script lang="ts">
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../../api/currentEpci";
    import {FicheActionInterface} from "../../../../generated/models/fiche_action";
    import Form from "../_Form"
    import {FicheActionStorable} from "../../../storables/FicheActionStorable";
    import {ficheActionStore} from "../../../api/localStore";
    import Button from "../../../components/shared/Button.svelte";

    let data: FicheActionInterface
    let id: string

    onMount(async () => {
        const epci_id = getCurrentEpciId()

        const urlParams = new URLSearchParams(window.location.search)
        const uid = urlParams.get('uid')
        id = FicheActionStorable.buildId(epci_id, uid)

        data = await ficheActionStore.retrieveById(id)
    });


    const handleDelete = (event) => {
        event.preventDefault()

        const confirmDelete =
            confirm('Êtes-vous sûr•e de vouloir supprimer une de vos actions personnalisées ?')

        if (confirmDelete) {
            ficheActionStore.deleteById(id)
            window.location.href = `/fiches/?epci_id=${data.epci_id}`
        }
    }

</script>


<svelte:head>
    <title>Ma fiche action</title>
</svelte:head>

<header class="flex my-10">
    <h1 class="text-3xl font-semibold  flex-grow">Ma fiche action</h1>
    <Button label="Supprimer"
            colorVariant="bramble"
            size="small"
            on:click={handleDelete}
            classNames=""
    />
</header>
<div class="p-5"></div>


{#if data}
    <Form data="{data}"/>
{/if}