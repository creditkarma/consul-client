import { CoreOptions, RequestResponse } from 'request'

import { ConsulClient } from './ConsulClient'

import { deleteRequest, getRequest, updateRequest } from './request'

import { IConsulMetadata, IKey } from './types'

import { DEFAULT_ADDRESS } from '../constants'

import { decodeBase64, deepMerge } from '../utils'

import { Observer } from '../Observer'

import * as logger from '../logger'

/**
 * This class wraps Consul's key/value HTTP API
 */
export class KvStore {
    private client: ConsulClient
    private consulAddress: string
    private baseOptions: CoreOptions
    private watchMap: Map<string, Observer<any>>

    constructor(consulAddress: string = DEFAULT_ADDRESS, baseOptions: CoreOptions = {}) {
        this.consulAddress = consulAddress
        this.baseOptions = baseOptions
        this.client = new ConsulClient(this.consulAddress)
        this.watchMap = new Map()
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
                    return Promise.reject(new Error(`${res.statusMessage}: ${res.body}`))
            }
        })
    }

    public ignore(key: IKey): void {
        this.watchMap.delete(key.path)
    }

    public watch<T>(key: IKey, requestOptions: CoreOptions = {}): Observer<T> {
        const extendedOptions = deepMerge(this.baseOptions, requestOptions)
        const observer: Observer<T> = new Observer()
        this.watchMap.set(key.path, observer)

        const _watch = (index?: string) => {
            this.client.send(
                getRequest({ key, index }),
                extendedOptions,
            ).then((res: RequestResponse) => {
                if (this.watchMap.has(key.path)) {
                    switch (res.statusCode) {
                        case 200:
                            const metadata: Array<IConsulMetadata> = res.body
                            observer.update(decodeBase64(metadata[0].Value) as T)
                            _watch(res.headers['x-consul-index'] as string)
                            break

                        case 404:
                            logger.error(`Unable to find value for key[${key.path}]`)
                            break

                        default:
                            logger.error(`Error retrieving key[${key.path}]: ${res.statusMessage}: ${res.body}`)
                            break
                    }
                }
            })
        }

        // Start watching
        _watch()

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
