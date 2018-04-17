export const DEFAULT_HOST: string = 'http://localhost:8500'
export const DEFAULT_API_VERSION: string = 'v1'

export const CONSUL_ADDRESS: string = 'CONSUL_ADDRESS'
export const CONSUL_DC: string = 'CONSUL_DC'
export const CONSUL_KEYS: string = 'CONSUL_KEYS'

export const CONSUL_INDEX_HEADER: string = 'X-Consul-Index'
export const CONSUL_TOKEN_HEADER: string = 'X-Consul-Token'
export const CONSUL_HOST_NAME: string = 'consul'

export const DEFAULT_ADDRESS: string = process.env[CONSUL_ADDRESS] || DEFAULT_HOST
