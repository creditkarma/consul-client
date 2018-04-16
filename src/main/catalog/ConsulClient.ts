import { CoreOptions, RequestResponse } from 'request'
import * as rpn from 'request-promise-native'

import { CatalogRequest, CatalogRequestType } from './types'

import {
    // cleanQueryParams,
    deepMerge,
    removeLeadingTrailingSlash,
} from '../utils'

import {
    CONSUL_HOST_NAME,
    DEFAULT_ADDRESS,
} from '../constants'

const request = rpn.defaults({
    json: true,
    simple: false,
    resolveWithFullResponse: true,
})

interface IHeaderMap {
    [key: string]: string | number | undefined
}

function headersForRequest(): IHeaderMap {
    const headers: IHeaderMap = {
        host: CONSUL_HOST_NAME,
    }

    return headers
}

export class ConsulClient {
    private destination: string
    constructor(dest?: string) {
        this.destination =
            dest !== undefined ?
                removeLeadingTrailingSlash(dest) :
                removeLeadingTrailingSlash(DEFAULT_ADDRESS)
    }

    public send(req: CatalogRequest, options: CoreOptions = {}): Promise<RequestResponse> {
        switch (req.type) {
            case CatalogRequestType.RegisterEntityRequest:
                return request(
                    deepMerge(options, {
                        uri: `${this.getPathForRequest(req)}/register`,
                        body: req.paylaod,
                        method: 'PUT',
                        headers: headersForRequest(),
                    }),
                ).promise()

            case CatalogRequestType.ListNodesRequest:
                return request(
                    deepMerge(options, {
                        uri: `${this.getPathForRequest(req)}/nodes`,
                        method: 'GET',
                        headers: headersForRequest(),
                    }),
                ).promise()

            case CatalogRequestType.ListServicesRequest:
                return request(
                    deepMerge(options, {
                        uri: `${this.getPathForRequest(req)}/services`,
                        method: 'GET',
                        headers: headersForRequest(),
                    }),
                ).promise()

            case CatalogRequestType.ListServiceNodesRequest:
                return request(
                    deepMerge(options, {
                        uri: `${this.getPathForRequest(req)}/service/${req.serviceName}`,
                        method: 'GET',
                        headers: headersForRequest(),
                    }),
                ).promise()

            default:
                const msg: any = req
                return Promise.reject(new Error(`Unsupported request type: ${msg}`))
        }
    }

    private getPathForRequest(req: CatalogRequest): string {
        return `${this.destination}/${req.apiVersion}/${req.section}`
    }
}
