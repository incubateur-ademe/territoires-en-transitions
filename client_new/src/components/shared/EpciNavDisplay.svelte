<script lang="ts">
    import {onMount} from 'svelte';
    import {getCurrentEpciId} from "../../api/currentEpci";
    import {epcis_default} from "../../../generated/models/epcis_default";

    let epciId = ''
    let epciName = ''
    onMount(async () => {
        epciId = getCurrentEpciId()
        epciName = epcis_default[epciId]
    });
</script>

{epciName} <a href="index.html?epci_id={epciId}" class="underline">(modifier)</a>
