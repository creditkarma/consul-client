import { CoreOptions, Response } from 'request'

import { DEFAULT_ADDRESS } from '../constants'
import { IQueryMap } from '../kv-store/types'
import { splitQueryMap } from '../utils'
import { deepMerge } from '../utils'
import { ConsulClient } from './ConsulClient'
import {
    CatalogRequestType,
    INodeDescription,
    IRegisterEntityPayload,
    IServiceDescription,
    IServiceMap,
} from './types'

export class Catalog {
    private client: ConsulClient
    private consulAddress: string
    private baseOptions: CoreOptions

    constructor(consulAddress: string = DEFAULT_ADDRESS, baseOptions: CoreOptions = {}) {
        this.consulAddress = consulAddress
        this.baseOptions = baseOptions
        this.client = new ConsulClient(this.consulAddress)
    }

    public registerEntity(
        service: IRegisterEntityPayload,
        requestOptions: CoreOptions = {},
    ): Promise<boolean> {
        const extendedOptions = deepMerge(this.baseOptions, requestOptions)
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
                        return Promise.resolve(res.body)

                    default:
                        return Promise.reject(new Error(res.statusMessage))
                }
            })
    }

    public listNodes(requestOptions: CoreOptions = {}): Promise<Array<INodeDescription>> {
        const extendedOptions = deepMerge(this.baseOptions, requestOptions)
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
                        return Promise.resolve(res.body)

                    default:
                        return Promise.reject(new Error(res.statusMessage))
                }
            })
    }

    public listServices(requestOptions: CoreOptions = {}): Promise<IServiceMap> {
        const extendedOptions = deepMerge(this.baseOptions, requestOptions)
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
                        return Promise.resolve(res.body)

                    default:
                        return Promise.reject(new Error(res.statusMessage))
                }
            })
    }

    public listNodesForService(
        serviceName: string,
        requestOptions: CoreOptions = {},
    ): Promise<Array<IServiceDescription>> {
        const extendedOptions = deepMerge(this.baseOptions, requestOptions)
        const queryMap: IQueryMap = splitQueryMap(serviceName)

        return this.client
            .send(
                {
                    type: CatalogRequestType.ListServiceNodesRequest,
                    apiVersion: 'v1',
                    section: 'catalog',
                    serviceName,
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
                        return Promise.resolve(res.body)

                    default:
                        return Promise.reject(new Error(res.statusMessage))
                }
            })
    }

    public resolveAddress(serviceName: string, requestOptions: CoreOptions = {}): Promise<string> {
        return this.listNodesForService(serviceName, requestOptions).then(
            (res: Array<IServiceDescription>) => {
                if (res.length > 0) {
                    const address: string = res[0].ServiceAddress || res[0].Address
                    const port: number = res[0].ServicePort || 80
                    return `${address}:${port}`
                } else {
                    throw new Error(`No service found with name[${serviceName}]`)
                }
            },
        )
    }
}
