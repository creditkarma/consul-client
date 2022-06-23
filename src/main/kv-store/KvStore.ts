import { OptionsOfJSONResponseBody, Response } from 'got'

import { ConsulClient } from './ConsulClient'

import { deleteRequest, getRequest, updateRequest } from './request'

import { IConsulMetadata, IKey } from './types'

import * as Utils from '../utils'

import { Observer, ValueSink } from '../Observer'

import * as logger from '../logger'

/**
 * This class wraps Consul's key/value HTTP API
 */
export class KvStore {
    private client: ConsulClient
    private consulAddresses: Array<string>
    private baseOptions: OptionsOfJSONResponseBody
    private watchMap: Map<string, Observer<any>>
    private maxRetries: number

    constructor(
        consulAddresses: Array<string> = Utils.defaultAddresses(),
        baseOptions: OptionsOfJSONResponseBody = {},
        maxRetries: number = 5,
    ) {
        this.consulAddresses = consulAddresses
        this.baseOptions = {
            responseType: 'json',
            ...baseOptions,
        }
        this.client = new ConsulClient(this.consulAddresses)
        this.watchMap = new Map()
        this.maxRetries = maxRetries
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
    public get<T>(
        key: IKey,
        requestOptions: OptionsOfJSONResponseBody = {},
    ): Promise<T | null> {
        const extendedOptions = Utils.deepMerge(
            this.baseOptions,
            requestOptions,
        )
        return this.client
            .send(getRequest({ key }), extendedOptions)
            .then((res: Response) => {
                switch (res.statusCode) {
                    case 200:
                        const metadata: Array<IConsulMetadata> =
                            res.body as Array<IConsulMetadata>
                        return Promise.resolve(
                            Utils.decodeBase64(metadata[0].Value) as T,
                        )

                    case 404:
                        return Promise.resolve(null)

                    default:
                        return Promise.reject(
                            new Error(`${res.statusMessage}: ${res.body}`),
                        )
                }
            })
    }

    public ignore(key: IKey): void {
        const observer: Observer<any> | undefined = this.watchMap.get(key.path)
        if (observer !== undefined) {
            observer.destroy()
            this.watchMap.delete(key.path)
        }
    }

    public watch<T>(
        key: IKey,
        requestOptions: OptionsOfJSONResponseBody = {},
    ): Observer<T> {
        const extendedOptions = Utils.deepMerge(
            this.baseOptions,
            requestOptions,
        )
        let numRetries: number = 0

        const observer = new Observer((sink: ValueSink<T>): void => {
            const _watch = (index?: number) => {
                this.client
                    .send(getRequest({ key, index }), extendedOptions)
                    .then((res: Response) => {
                        if (this.watchMap.has(key.path)) {
                            switch (res.statusCode) {
                                case 200:
                                    const metadata: Array<IConsulMetadata> =
                                        res.body as Array<IConsulMetadata>
                                    const modifyIndex: number =
                                        metadata[0].ModifyIndex
                                    numRetries = 0

                                    if (modifyIndex !== index) {
                                        if (
                                            sink(
                                                undefined,
                                                Utils.decodeBase64(
                                                    metadata[0].Value,
                                                ) as T,
                                            )
                                        ) {
                                            _watch(modifyIndex)
                                        }
                                    } else {
                                        setTimeout(() => _watch(index), 5000)
                                    }

                                    break

                                case 404:
                                    logger.warn(
                                        `Unable to find value for key[${key.path}]. Retrying...`,
                                    )
                                    setTimeout(_watch, 5000)
                                    break

                                default:
                                    logger.error(
                                        `Error retrieving key[${key.path}]: ${res.statusMessage}.`,
                                    )
                                    if (numRetries < this.maxRetries) {
                                        setTimeout(_watch, 5000)
                                        numRetries += 1
                                    } else {
                                        sink(
                                            new Error(
                                                `Error retrieving key[${key.path}]: ${res.statusMessage}.`,
                                            ),
                                        )
                                    }
                                    break
                            }
                        }
                    })
                    .catch((err: any) => {
                        logger.error(
                            `Error retrieving key[${key.path}]: ${err.message}.`,
                        )
                        if (numRetries < this.maxRetries) {
                            setTimeout(_watch, 5000)
                            numRetries += 1
                        } else {
                            sink(
                                new Error(
                                    `Error retrieving key[${key.path}]: ${err.message}.`,
                                ),
                            )
                        }
                    })
            }

            // Start watching
            _watch()
        })

        this.watchMap.set(key.path, observer)
        return observer
    }

    public set(
        key: IKey,
        value: any,
        requestOptions: OptionsOfJSONResponseBody = {},
    ): Promise<boolean> {
        const extendedOptions = Utils.deepMerge(
            this.baseOptions,
            requestOptions,
        )
        return this.client
            .send(updateRequest({ key, value }), extendedOptions)
            .then((res: Response) => {
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

    public delete(
        key: IKey,
        requestOptions: OptionsOfJSONResponseBody = {},
    ): Promise<boolean> {
        const extendedOptions = Utils.deepMerge(
            this.baseOptions,
            requestOptions,
        )
        return this.client
            .send(deleteRequest({ key }), extendedOptions)
            .then((res: Response) => {
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
