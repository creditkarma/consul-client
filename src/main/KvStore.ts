import { CoreOptions, RequestResponse } from 'request'

import { ConsulClient } from './ConsulClient'

import { deleteRequest, getRequest, updateRequest } from './request'

import { IConsulMetadata, IKey } from './types'

import { CONSUL_ADDRESS, DEFAULT_HOST } from './constants'

import { decodeBase64, deepMerge } from './utils'

import { Observable } from './Observable'

const defaultAddress: string = process.env[CONSUL_ADDRESS] || DEFAULT_HOST

function _watch<T>(
    client: ConsulClient,
    key: IKey,
    index: number | undefined,
    observer: Observable<T>,
    requestOptions: CoreOptions,
): void {
    client.send(
        getRequest({ key, index }),
        requestOptions,
    ).then((res: RequestResponse) => {
        switch (res.statusCode) {
            case 200:
                const metadata: Array<IConsulMetadata> = res.body
                observer.update(decodeBase64(metadata[0].Value) as T)
                _watch(client, key, metadata[0].ModifyIndex, observer, requestOptions)
                break

            case 404:
                console.error(`[consul-client] Unable to find value for key[${key}]`)
                break

            default:
                console.error(`[consul-client] Error retrieving key[${key}]: `, res.statusMessage)
                break
        }
    })
}

/**
 * This class wraps Consul's key/value HTTP API
 */
export class KvStore {
    private client: ConsulClient
    private consulAddress: string
    private baseOptions: CoreOptions

    constructor(consulAddress: string = defaultAddress, baseOptions: CoreOptions = {}) {
        this.consulAddress = consulAddress
        this.baseOptions = baseOptions
        this.client = new ConsulClient(this.consulAddress)
    }

    /**
     * Consul returns values wrapped in metadata.
     *
     * {
     *   "CreateIndex": 100,
     *   "ModifyIndex": 200,
     *   "LockIndex": 200,
     *   "Key": "zip",
     *   "Flags": 0,
     *   "Value": "dGVzdA==",
     *   "Session": "adf4238a-882b-9ddc-4a9d-5b6758e4159e"
     * }
     *
     * The Value is a Base64 encoded string
     */
    public get<T>(key: IKey, requestOptions: CoreOptions = {}): Promise<T | null> {
        const extendedOptions = deepMerge(this.baseOptions, requestOptions)
        return this.client.send(
            getRequest({ key }),
            extendedOptions,
        ).then((res: RequestResponse) => {
            switch (res.statusCode) {
                case 200:
                    const metadata: Array<IConsulMetadata> = res.body
                    return Promise.resolve(decodeBase64(metadata[0].Value) as T)

                case 404:
                    return Promise.resolve(null)

                default:
                    return Promise.reject(new Error(res.statusMessage))
            }
        })
    }

    public watch<T>(key: IKey, requestOptions: CoreOptions = {}): Observable<T> {
        const extendedOptions = deepMerge(this.baseOptions, requestOptions)
        const observer: Observable<T> = new Observable()
        _watch(this.client, key, undefined, observer, extendedOptions)
        return observer
    }

    public set(key: IKey, value: any, requestOptions: CoreOptions = {}): Promise<boolean> {
        const extendedOptions = deepMerge(this.baseOptions, requestOptions)
        return this.client.send(
            updateRequest({ key, value }),
            extendedOptions,
        ).then((res: RequestResponse) => {
            switch (res.statusCode) {
                case 200:
                    return Promise.resolve(res.body as boolean)

                case 404:
                    return Promise.resolve(false)

                default:
                    return Promise.reject(new Error(res.statusMessage))
            }
        })
    }

    public delete(key: IKey, requestOptions: CoreOptions = {}): Promise<boolean> {
        const extendedOptions = deepMerge(this.baseOptions, requestOptions)
        return this.client.send(
            deleteRequest({ key }),
            extendedOptions,
        ).then((res: RequestResponse) => {
            switch (res.statusCode) {
                case 200:
                    return Promise.resolve(res.body as boolean)

                case 404:
                    return Promise.resolve(false)

                default:
                    return Promise.reject(new Error(res.statusMessage))
            }
        })
    }
}
