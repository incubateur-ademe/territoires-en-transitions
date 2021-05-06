type ProductionEnvironment = 'local' | 'sandbox' | 'staging' | 'release'

export const getCurrentEnvironment = (): ProductionEnvironment => {
    const hostname = window.location.hostname;
    if (hostname.substring(0, 10) === 'localhost') return 'local';
    if (hostname === 'sandbox.territoiresentransitions.fr') return 'sandbox'
    if (hostname === 'staging.territoiresentransitions.fr') return 'staging'
    throw `no environment for ${hostname}`
}

export const testUIVisibility = (): boolean => {
    const environment = getCurrentEnvironment()
    return environment === 'local' || environment === 'sandbox';
}