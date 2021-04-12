export const getCurrentEnvironment = (): string => {
    const hostname = window.location.hostname;
    if (hostname.substring(0, 10) === 'localhost') return 'local';
    if (hostname === 'sandbox.territoiresentransitions.fr') return 'sandbox'
    if (hostname === 'staging.territoiresentransitions.fr') return 'staging'
    throw `no environment for ${hostname}`
}