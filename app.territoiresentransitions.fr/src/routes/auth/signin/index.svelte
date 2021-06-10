<script lang="ts">
    /**
     * Redirects to the ADEME keycloak sign in form
     *
     * Then keycloak will redirect to `redirect/index.svelte`
     */
    import {onMount} from "svelte";
    import {getCurrentEnvironment} from "../../../api/currentEnvironment";


    onMount(() => {
        const environment = getCurrentEnvironment()
        let host = window.location.hostname
        if (environment === 'local') host = 'sandbox.territoiresentransitions.fr'
        const redirect = `https://${host}/auth/redirect/`
        const realm = 'master'
        const keycloak = 'https://moncompte.ademe.fr'

        window.location.href =
            `${keycloak}/auth/realms/${realm}/protocol/openid-connect/auth`
            + `?client_id=territoiresentransitions&response_type=code&redirect_uri=${redirect}`

    })
</script>
<h1>Redirection vers moncompte.ademe.fr</h1>