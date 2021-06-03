<script lang="ts">
    /**
     * Redirects to the keycloak sign in form
     */
    import {onMount} from "svelte";
    import {getCurrentEnvironment} from "../../../api/currentEnvironment";

    const domains = {
        "app": "https://territoiresentransitions.osc-fr1.scalingo.io",
        "sandbox": "https://sandboxterritoires.osc-fr1.scalingo.io",
        "local": "https://sandboxterritoires.osc-fr1.scalingo.io",
    }


    onMount(() => {
        const environment = getCurrentEnvironment()
        const domain = domains[environment]
        const redirect = `${domain}/v2/auth/${environment}/redirect`
        const realm = 'master'
        const keycloak = 'https://moncompte.ademe.fr'

        window.location.href =
            `${keycloak}/auth/realms/${realm}/protocol/openid-connect/auth`
            + `?client_id=territoiresentransitions&response_type=code&redirect_uri=${redirect}`

    })
</script>
<h1>Redirection en cours</h1>