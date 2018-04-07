function isDebug(): boolean {
    return (
        process.env.CONSUL_DEBUG === 'true' ||
        process.env.DEBUG === 'true'
    )
}

export const log = (msg: string, data?: any) => {
    if (data !== undefined && isDebug()) {
        console.log(`[consul-client:info]: ${msg}: `, data)
    } else if (isDebug()) {
        console.log(`[consul-client:info]: ${msg}`)
    }
}

export const warn = (msg: string, data?: any) => {
    if (data !== undefined && isDebug()) {
        console.warn(`[consul-client:warn]: ${msg}: `, data)
    } else if (isDebug()) {
        console.warn(`[consul-client:warn]: ${msg}`)
    }
}

export const error = (msg: string, data?: any) => {
    if (data !== undefined) {
        console.error(`[consul-client:error]: ${msg}: `, data)
    } else {
        console.error(`[consul-client:error]: ${msg}`)
    }
}
