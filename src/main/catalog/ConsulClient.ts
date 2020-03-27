import { CoreOptions, RequestResponse } from 'request'
import * as rpn from 'request-promise-native'

import { CatalogRequest, CatalogRequestType } from './types'

import { cleanQueryParams, deepMerge, headersForRequest } from '../utils'

import { BaseClient } from '../BaseClient'

const request = rpn.defaults({
    json: true,
    simple: false,
    resolveWithFullResponse: true,
})

export class ConsulClient extends BaseClient<CatalogRequest> {
    protected processRequest(
        req: CatalogRequest,
        options: CoreOptions = {},
    ): Promise<RequestResponse> {
        switch (req.type) {
            case CatalogRequestType.RegisterEntityRequest:
                return request(
                    deepMerge(options, {
                        uri: `${this.getPathForRequest(req)}/register`,
                        body: req.paylaod,
                        method: 'PUT',
                        headers: headersForRequest(req),
                        qs: cleanQueryParams({
                            dc: req.dc,
                            index: req.index,
                        }),
                    }),
                ).promise()

            case CatalogRequestType.ListNodesRequest:
                return request(
                    deepMerge(options, {
                        uri: `${this.getPathForRequest(req)}/nodes`,
                        method: 'GET',
                        headers: headersForRequest(req),
                        qs: cleanQueryParams({
                            dc: req.dc,
                            index: req.index,
                        }),
                    }),
                ).promise()

            case CatalogRequestType.ListServicesRequest:
                return request(
                    deepMerge(options, {
                        uri: `${this.getPathForRequest(req)}/services`,
                        method: 'GET',
                        headers: headersForRequest(req),
                        qs: cleanQueryParams({
                            dc: req.dc,
                            index: req.index,
                        }),
                    }),
                ).promise()

            case CatalogRequestType.ListServiceNodesRequest:
                const uri = `${this.getHealthPathForRequest(req)}/service/${
                    req.serviceName
                }`
                const newOptions = deepMerge(options, {
                    uri,
                    method: 'GET',
                    headers: headersForRequest(req),
                    qs: cleanQueryParams({
                        dc: req.dc,
                        index: req.index,
                        passing: true,
                        wait: '55s',
                        stale: '',
                    }),
                })
                return request(newOptions).promise()

            default:
                const msg: any = req
                return Promise.reject(
                    new Error(`Unsupported request type: ${msg}`),
                )
        }
    }

    protected getHealthPathForRequest(req: CatalogRequest): string {
        return `${this.currentDestination}/${req.apiVersion}/health`
    }

    protected getPathForRequest(req: CatalogRequest): string {
        return `${this.currentDestination}/${req.apiVersion}/${req.section}`
    }
}
