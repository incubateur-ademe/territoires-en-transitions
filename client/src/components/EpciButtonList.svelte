<script lang="ts">
    import {epcis_default} from "../../vendors/epcis_default";
    import Button from "./shared/Button.svelte";
</script>
<section class="">
    <ul class="flex flex-wrap gap-4 ">
        {#each Object.entries(epcis_default) as [id, name]}
            <Button asLink
                    href="mesures.html?epci_id={id}"
                    label="{name}"
                    classNames="text-center border-green-700 border-2 hover:bg-green-100 active:bg-green-600"
            />
        {/each}
    </ul>
</section>