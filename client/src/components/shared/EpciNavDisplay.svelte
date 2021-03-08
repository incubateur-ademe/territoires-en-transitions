<script lang="ts">
    import {getCurrentEpciId} from "../../api/currentEpci";
    import {epcis_default} from "../../../vendors/epcis_default";

    const epciId = getCurrentEpciId()
    const epciName = epcis_default[epciId]
</script>

{epciName} <a href="index.html?epci_id={epciId}" class="underline">(modifier)</a>
