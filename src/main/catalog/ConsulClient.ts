import { HTTPError, OptionsOfJSONResponseBody, Response } from 'got'

import got from 'got'

import { CatalogRequest, CatalogRequestType } from './types'

import { cleanQueryParams, deepMerge, headersForRequest } from '../utils'

import { BaseClient } from '../BaseClient'

import * as logger from '../logger'
export class ConsulClient extends BaseClient<CatalogRequest> {
    protected processRequest(
        req: CatalogRequest,
        options: OptionsOfJSONResponseBody = {
            responseType: 'json',
        },
    ): Promise<Response> {
        switch (req.type) {
            case CatalogRequestType.RegisterEntityRequest:
                return new Promise(async (resolve, reject) => {
                    try {
                        const response = await got(
                            `${this.getPathForRequest(req)}/register`,
                            deepMerge(options, {
                                body: Buffer.from(JSON.stringify(req.paylaod)),
                                method: 'PUT',
                                headers: headersForRequest(req),
                                searchParams: cleanQueryParams({
                                    dc: req.dc,
                                    index: req.index,
                                }),
                            }),
                        )
                        resolve(response)
                    } catch (err) {
                        if (err instanceof HTTPError) {
                            // Allow non 2xx/3xx responses to resolve upstream
                            resolve(err.response)
                        } else {
                            logger.error(
                                `Unexpected error on PUT: ${
                                    err instanceof Error ? err.message : err
                                }`,
                            )
                            reject(err)
                        }
                    }
                })
            case CatalogRequestType.ListNodesRequest:
                return new Promise(async (resolve, reject) => {
                    try {
                        const response = await got(
                            `${this.getPathForRequest(req)}/nodes`,
                            deepMerge(options, {
                                method: 'GET',
                                headers: headersForRequest(req),
                                searchParams: cleanQueryParams({
                                    dc: req.dc,
                                    index: req.index,
                                }),
                            }),
                        )
                        resolve(response)
                    } catch (err) {
                        if (err instanceof HTTPError) {
                            // Allow non 2xx/3xx responses to resolve upstream
                            resolve(err.response)
                        } else {
                            logger.error(
                                `Unexpected error on GET: ${
                                    err instanceof Error ? err.message : err
                                }`,
                            )
                            reject(err)
                        }
                    }
                })
            case CatalogRequestType.ListServicesRequest:
                return new Promise(async (resolve, reject) => {
                    try {
                        const response = await got(
                            `${this.getPathForRequest(req)}/services`,
                            deepMerge(options, {
                                method: 'GET',
                                headers: headersForRequest(req),
                                searchParams: cleanQueryParams({
                                    dc: req.dc,
                                    index: req.index,
                                }),
                            }),
                        )
                        resolve(response)
                    } catch (err) {
                        if (err instanceof HTTPError) {
                            // Allow non 2xx/3xx responses to resolve upstream
                            resolve(err.response)
                        } else {
                            logger.error(
                                `Unexpected error on GET: ${
                                    err instanceof Error ? err.message : err
                                }`,
                            )
                            reject(err)
                        }
                    }
                })
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
                })
                return new Promise(async (resolve, reject) => {
                    try {
                        const response = await got(
                            `${this.getHealthPathForRequest(req)}/service/${
                                req.serviceName
                            }`,
                            newOptions,
                        )
                        resolve(response)
                    } catch (err) {
                        if (err instanceof HTTPError) {
                            // Allow non 2xx/3xx responses to resolve upstream
                            resolve(err.response)
                        } else {
                            logger.error(
                                `Unexpected error on GET: ${
                                    err instanceof Error ? err.message : err
                                }`,
                            )
                            reject(err)
                        }
                    }
                })
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
