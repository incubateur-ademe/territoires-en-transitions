<script lang="ts">
    /**
     * Display an Epci in an card
     */
    import {EpciStorable} from "../../storables/EpciStorable";
    import Button from "../../components/shared/Button/Button.svelte";

    export let epci: EpciStorable
    export let writable: boolean = false

    $: color = writable ? 'nettle' : 'ash'

    const goto = (section: string, epciId: string) => {
        window.location.href = `/${section}/?epci_id=${epciId}`
    }

</script>

<div class="shadow-sm bg-white p-2">
    <h3 class="text-xl">{epci.nom}</h3>
    <div class="pb-5"></div>
    <Button colorVariant="{color}" on:click={() => goto('fiches', epci.uid)}>Plan d'actions</Button>
    <Button colorVariant="{color}" on:click={() => goto('actions_referentiels', epci.uid)}>Référentiels</Button>
    <Button colorVariant="{color}" on:click={() => goto('indicateurs', epci.uid)}>Indicateurs</Button>
</div>

