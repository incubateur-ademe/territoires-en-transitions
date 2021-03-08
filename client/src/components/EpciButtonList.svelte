<script lang="ts">
    import {epcis_default} from "../../vendors/epcis_default";
    import Button from "./shared/Button.svelte";
</script>
<section class="p-10">
    <ul class="pb-10 flex justify-evenly max-w-2xl m-auto">
        {#each Object.entries(epcis_default) as [id, name]}
            <Button asLink
                    href="mesures.html?epci_id={id}"
                    label="{name}"
                    classNames="px-6 py-3 border-green-700 border-2 hover:bg-green-100 active:bg-green-600"
            />
        {/each}
    </ul>
</section>