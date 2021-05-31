export const getCurrentAPI = (): string => {
    const hostname = window.location.hostname;
    if (hostname.substring(0, 10) === 'localhost') return 'http://localhost:8000';
    if (hostname === 'sandbox.territoiresentransitions.fr') return 'https://sandboxterritoires.osc-fr1.scalingo.io'
    if (hostname === 'app.territoiresentransitions.fr') return 'https://territoiresentransitions.osc-fr1.scalingo.io'
    throw `no API host for ${hostname}`
}