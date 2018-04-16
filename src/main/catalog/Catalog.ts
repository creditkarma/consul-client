import { CoreOptions, Response } from 'request'

import { DEFAULT_ADDRESS } from '../constants'
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
    // private baseOptions: CoreOptions

    constructor(consulAddress: string = DEFAULT_ADDRESS, baseOptions: CoreOptions = {}) {
        this.consulAddress = consulAddress
        // this.baseOptions = baseOptions
        this.client = new ConsulClient(this.consulAddress)
    }

    public registerEntity(service: IRegisterEntityPayload, requestOptions: CoreOptions = {}): Promise<boolean> {
        return this.client.send({
            type: CatalogRequestType.RegisterEntityRequest,
            apiVersion: 'v1',
            section: 'catalog',
            paylaod: service,
        }).then((res: Response) => {
            switch (res.statusCode) {
                case 200:
                    return Promise.resolve(res.body)

                default:
                    return Promise.reject(new Error(res.statusMessage))
            }
        })
    }

    public listNodes(): Promise<Array<INodeDescription>> {
        return this.client.send({
            type: CatalogRequestType.ListNodesRequest,
            apiVersion: 'v1',
            section: 'catalog',
        }).then((res: Response) => {
            switch (res.statusCode) {
                case 200:
                    return Promise.resolve(res.body)

                default:
                    return Promise.reject(new Error(res.statusMessage))
            }
        })
    }

    public listServices(): Promise<IServiceMap> {
        return this.client.send({
            type: CatalogRequestType.ListServicesRequest,
            apiVersion: 'v1',
            section: 'catalog',
        }).then((res: Response) => {
            switch (res.statusCode) {
                case 200:
                    return Promise.resolve(res.body)

                default:
                    return Promise.reject(new Error(res.statusMessage))
            }
        })
    }

    public listNodesForService(serviceName: string): Promise<Array<IServiceDescription>> {
        return this.client.send({
            type: CatalogRequestType.ListServiceNodesRequest,
            apiVersion: 'v1',
            section: 'catalog',
            serviceName,
        }).then((res: Response) => {
            switch (res.statusCode) {
                case 200:
                    return Promise.resolve(res.body)

                default:
                    return Promise.reject(new Error(res.statusMessage))
            }
        })
    }

    public resolveAddress(serviceName: string): Promise<string> {
        return this.listNodesForService(serviceName).then((res: Array<IServiceDescription>) => {
            if (res.length > 0) {
                return res[0].ServiceAddress || res[0].Address
            } else {
                throw new Error(`No service found with name[${serviceName}]`)
            }
        })
    }
}
