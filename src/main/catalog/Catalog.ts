import { OptionsOfJSONResponseBody, Response } from 'got'

import * as logger from '../logger'
import { Observer, ValueSink } from '../Observer'
import * as Utils from '../utils'
import { ConsulClient } from './ConsulClient'
import {
    CatalogRequestType,
    INodeDescription,
    IRegisterEntityPayload,
    IServiceHealthDescription,
    IServiceMap,
} from './types'

import { IQueryMap } from '../types'

export class Catalog {
    private client: ConsulClient
    private consulAddresses: Array<string>
    private baseOptions: OptionsOfJSONResponseBody
    private watchMap: Map<string, Observer<string>>
    private maxRetries: number

    constructor(
        consulAddresses: Array<string> = Utils.defaultAddresses(),
        baseOptions: OptionsOfJSONResponseBody = {
            responseType: 'json',
        },
        maxRetries: number = 5,
    ) {
        this.consulAddresses = consulAddresses
        this.baseOptions = baseOptions
        this.client = new ConsulClient(this.consulAddresses)
        this.watchMap = new Map()
        this.maxRetries = maxRetries
    }

    public registerEntity(
        service: IRegisterEntityPayload,
        requestOptions: OptionsOfJSONResponseBody = {
            responseType: 'json',
        },
    ): Promise<boolean> {
        const extendedOptions = Utils.deepMerge(
            this.baseOptions,
            requestOptions,
        )
        return this.client
            .send(
                {
                    type: CatalogRequestType.RegisterEntityRequest,
                    apiVersion: 'v1',
                    section: 'catalog',
                    paylaod: service,
                },
                extendedOptions,
            )
            .then((res: Response) => {
                switch (res.statusCode) {
                    case 200:
                        return Promise.resolve(res.body as boolean)

                    default:
                        return Promise.reject(new Error(res.statusMessage))
                }
            })
    }

    public listNodes(
        requestOptions: OptionsOfJSONResponseBody = {
            responseType: 'json',
        },
    ): Promise<Array<INodeDescription>> {
        const extendedOptions = Utils.deepMerge(
            this.baseOptions,
            requestOptions,
        )
        return this.client
            .send(
                {
                    type: CatalogRequestType.ListNodesRequest,
                    apiVersion: 'v1',
                    section: 'catalog',
                },
                extendedOptions,
            )
            .then((res: Response) => {
                switch (res.statusCode) {
                    case 200:
                        return Promise.resolve(
                            res.body as Array<INodeDescription>,
                        )

                    default:
                        return Promise.reject(new Error(res.statusMessage))
                }
            })
    }

    public listServices(
        requestOptions: OptionsOfJSONResponseBody = {
            responseType: 'json',
        },
    ): Promise<IServiceMap> {
        const extendedOptions = Utils.deepMerge(
            this.baseOptions,
            requestOptions,
        )
        return this.client
            .send(
                {
                    type: CatalogRequestType.ListServicesRequest,
                    apiVersion: 'v1',
                    section: 'catalog',
                },
                extendedOptions,
            )
            .then((res: Response) => {
                switch (res.statusCode) {
                    case 200:
                        return Promise.resolve(res.body as IServiceMap)

                    default:
                        return Promise.reject(new Error(res.statusMessage))
                }
            })
    }

    public listNodesForService(
        serviceName: string,
        requestOptions: OptionsOfJSONResponseBody = {
            responseType: 'json',
        },
    ): Promise<Array<IServiceHealthDescription>> {
        const extendedOptions = Utils.deepMerge(
            this.baseOptions,
            requestOptions,
        )
        const queryMap: IQueryMap = Utils.splitQueryMap(serviceName)
        const trimmedServiceName = serviceName.split('?')[0]

        return this.client
            .send(
                {
                    type: CatalogRequestType.ListServiceNodesRequest,
                    apiVersion: 'v1',
                    section: 'catalog',
                    serviceName: trimmedServiceName,
                    dc: queryMap.dc,
                    service: queryMap.service,
                    tag: queryMap.tag,
                    near: queryMap.near,
                    'node-meta': queryMap['node-meta'],
                },
                extendedOptions,
            )
            .then((res: Response) => {
                switch (res.statusCode) {
                    case 200:
                        return Promise.resolve(
                            res.body as Array<IServiceHealthDescription>,
                        )

                    default:
                        return Promise.reject(new Error(res.statusMessage))
                }
            })
    }

    public resolveAddress(
        serviceName: string,
        requestOptions: OptionsOfJSONResponseBody = {
            responseType: 'json',
        },
    ): Promise<string> {
        return this.listNodesForService(serviceName, requestOptions).then(
            (res: Array<IServiceHealthDescription>) => {
                if (res.length > 0) {
                    // Pick a random service from the list of healthy services
                    const ID = Math.floor(Math.random() * res.length)
                    /*
                    https://www.consul.io/api/catalog.html#serviceaddress
                    ServiceAddress is the IP address of the service host — if empty, node
                    address should be used
                    */
                    const pickedNode = res[ID]
                    const address: string =
                        pickedNode.Service.Address &&
                        pickedNode.Service.Address !== ''
                            ? pickedNode.Service.Address
                            : pickedNode.Node.Address
                    const port: number = pickedNode.Service.Port || 80
                    return `${address}:${port}`
                } else {
                    throw new Error(
                        `No service found with name[${serviceName}]`,
                    )
                }
            },
        )
    }

    public ignoreAddress(serviceName: string): void {
        const observer: Observer<string> | undefined =
            this.watchMap.get(serviceName)
        if (observer !== undefined) {
            observer.destroy()
            this.watchMap.delete(serviceName)
        }
    }

    public watchAddress(
        serviceName: string,
        requestOptions: OptionsOfJSONResponseBody = {
            responseType: 'json',
        },
    ): Observer<string> {
        const extendedOptions = Utils.deepMerge(
            this.baseOptions,
            requestOptions,
        )
        const queryMap: IQueryMap = Utils.splitQueryMap(serviceName)
        let numRetries: number = 0

        const observer = new Observer((sink: ValueSink<string>): void => {
            const _watch = (index?: number) => {
                this.client
                    .send(
                        {
                            type: CatalogRequestType.ListServiceNodesRequest,
                            apiVersion: 'v1',
                            section: 'catalog',
                            serviceName,
                            index,
                            dc: queryMap.dc,
                            service: queryMap.service,
                            tag: queryMap.tag,
                            near: queryMap.near,
                            'node-meta': queryMap['node-meta'],
                        },
                        extendedOptions,
                    )
                    .then((res: Response) => {
                        if (this.watchMap.has(serviceName)) {
                            switch (res.statusCode) {
                                case 200:
                                    const metadata: Array<IServiceHealthDescription> =
                                        res.body as Array<IServiceHealthDescription>
                                    // Pick a random service from the list of healthy services
                                    const ID = Math.floor(
                                        Math.random() * metadata.length,
                                    )

                                    /*
                                    https://www.consul.io/api/catalog.html#serviceaddress
                                    ServiceAddress is the IP address of the service host — if empty, node
                                    address should be used
                                    */
                                    const pickedNode = metadata[ID]
                                    const address: string =
                                        pickedNode.Service.Address &&
                                        pickedNode.Service.Address !== ''
                                            ? pickedNode.Service.Address
                                            : pickedNode.Node.Address
                                    const port: number =
                                        pickedNode.Service.Port || 80
                                    const modifyIndex: number =
                                        pickedNode.Service.ModifyIndex
                                    numRetries = 0

                                    if (modifyIndex !== index) {
                                        if (
                                            sink(
                                                undefined,
                                                `${address}:${port}`,
                                            )
                                        ) {
                                            _watch(modifyIndex)
                                        }
                                    } else {
                                        setTimeout(() => _watch(index), 5000)
                                    }

                                    break

                                case 404:
                                    logger.error(
                                        `Unable to find address for service[${serviceName}]`,
                                    )
                                    if (numRetries < this.maxRetries) {
                                        setTimeout(_watch, 5000)
                                        numRetries += 1
                                    }
                                    break

                                default:
                                    logger.error(
                                        `Error retrieving address for service[${serviceName}]: ${res.statusMessage}.`,
                                    )
                                    if (numRetries < this.maxRetries) {
                                        setTimeout(_watch, 5000)
                                        numRetries += 1
                                    } else {
                                        sink(
                                            new Error(
                                                `Error retrieving address for service[${serviceName}]: ${res.statusMessage}.`,
                                            ),
                                        )
                                    }
                                    break
                            }
                        }
                    })
                    .catch((err: any) => {
                        logger.error(
                            `Error retrieving address for service[${serviceName}]: ${err.message}.`,
                        )
                        if (numRetries < this.maxRetries) {
                            setTimeout(_watch, 5000)
                            numRetries += 1
                        } else {
                            sink(
                                new Error(
                                    `Error retrieving address for service[${serviceName}]: ${err.message}.`,
                                ),
                            )
                        }
                    })
            }

            // Start watching
            _watch()
        })

        this.watchMap.set(serviceName, observer)
        return observer
    }
}
