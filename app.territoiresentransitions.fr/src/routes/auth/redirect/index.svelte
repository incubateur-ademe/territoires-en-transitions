<script>
    import {onMount} from "svelte";
    import {getCurrentAPI} from "../../../api/currentAPI";

    let code = ''
    let accessToken = ''

    onMount(async () => {
        const urlParams = new URLSearchParams(window.location.search)
        code = urlParams.get('code')

        const api = getCurrentAPI()
        const endpoint = `${api}/v2/auth/token`

        const host = window.location.hostname
        const redirect_uri = `https://${host}/auth/redirect/`

        const response = await fetch(`${endpoint}?redirect_uri=${redirect_uri}&code=${code}`)
        const token = await response.json()
        accessToken = token['access_token']
    })
</script>

<h1>code</h1>
<textarea class="w-full" rows="2">{code}</textarea>

<h2>access token</h2>
<textarea class="w-full" rows="10">{accessToken}</textarea>
