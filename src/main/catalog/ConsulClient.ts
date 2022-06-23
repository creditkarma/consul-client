import { HTTPError, OptionsOfJSONResponseBody, Response } from 'got'

import got from 'got'

import { CatalogRequest, CatalogRequestType } from './types'

import { cleanQueryParams, deepMerge, headersForRequest } from '../utils'

import { BaseClient } from '../BaseClient'

import * as logger from '../logger'
export class ConsulClient extends BaseClient<CatalogRequest> {
    protected async processRequest(
        req: CatalogRequest,
        options: OptionsOfJSONResponseBody = {},
    ): Promise<Response> {
        try {
            switch (req.type) {
                case CatalogRequestType.RegisterEntityRequest:
                    return await got(
                        `${this.getPathForRequest(req)}/register`,
                        deepMerge(options, {
                            body: Buffer.from(JSON.stringify(req.payload)),
                            method: 'PUT',
                            headers: headersForRequest(req),
                            searchParams: cleanQueryParams({
                                dc: req.dc,
                                index: req.index,
                            }),
                            responseType: 'json',
                        }),
                    )
                case CatalogRequestType.ListNodesRequest:
                    return await got(
                        `${this.getPathForRequest(req)}/nodes`,
                        deepMerge(options, {
                            method: 'GET',
                            headers: headersForRequest(req),
                            searchParams: cleanQueryParams({
                                dc: req.dc,
                                index: req.index,
                            }),
                            responseType: 'json',
                        }),
                    )
                case CatalogRequestType.ListServicesRequest:
                    return await got(
                        `${this.getPathForRequest(req)}/services`,
                        deepMerge(options, {
                            method: 'GET',
                            headers: headersForRequest(req),
                            searchParams: cleanQueryParams({
                                dc: req.dc,
                                index: req.index,
                            }),
                            responseType: 'json',
                        }),
                    )
                case CatalogRequestType.ListServiceNodesRequest:
                    const newOptions = deepMerge(options, {
                        method: 'GET',
                        headers: headersForRequest(req),
                        searchParams: cleanQueryParams({
                            dc: req.dc,
                            index: req.index,
                            passing: true,
                            wait: '55s',
                            stale: '',
                        }),
                        responseType: 'json',
                    })
                    return await got(
                        `${this.getHealthPathForRequest(req)}/service/${
                            req.serviceName
                        }`,
                        newOptions,
                    )
                default:
                    const msg: any = req
                    return Promise.reject(
                        new Error(`Unsupported request type: ${msg}`),
                    )
            }
        } catch (err) {
            if (err instanceof HTTPError) {
                // Allow non 2xx/3xx responses to resolve upstream
                return err.response
            } else {
                logger.error(
                    `Unexpected error on ${req.type}: ${
                        err instanceof Error ? err.message : err
                    }`,
                )
                throw err
            }
        }
    }

    protected getHealthPathForRequest(req: CatalogRequest): string {
        return `${this.currentDestination}/${req.apiVersion}/health`
    }

    protected getPathForRequest(req: CatalogRequest): string {
        return `${this.currentDestination}/${req.apiVersion}/${req.section}`
    }
}
