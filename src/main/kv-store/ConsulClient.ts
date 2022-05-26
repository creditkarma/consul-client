import { HTTPError, OptionsOfJSONResponseBody, Response } from 'got'

import got from 'got'

import { KVRequest, RequestType } from './types'

import {
    cleanQueryParams,
    deepMerge,
    headersForRequest,
    requestToPath,
} from '../utils'

import { BaseClient } from '../BaseClient'

import * as logger from '../logger'
export class ConsulClient extends BaseClient<KVRequest> {
    protected processRequest(
        req: KVRequest,
        options: OptionsOfJSONResponseBody = {
            responseType: 'json',
        },
    ): Promise<Response> {
        switch (req.type) {
            case RequestType.GetRequest:
                return new Promise(async (resolve, reject) => {
                    try {
                        const response = await got(
                            this.getPathForRequest(req),
                            deepMerge(options, {
                                method: 'GET',
                                headers: headersForRequest(req),
                                searchParams: cleanQueryParams({
                                    dc: req.key.dc,
                                    index: req.index,
                                }),
                            }),
                        )
                        resolve(response)
                    } catch (err) {
                        this.handleErrorResponseForMethod(
                            err,
                            'GET',
                            resolve,
                            reject,
                        )
                    }
                })
            case RequestType.UpdateRequest:
                return new Promise(async (resolve, reject) => {
                    try {
                        const response = await got(
                            this.getPathForRequest(req),
                            deepMerge(options, {
                                body: Buffer.from(JSON.stringify(req.value)),
                                method: 'PUT',
                                headers: headersForRequest(req),
                                searchParams: cleanQueryParams({
                                    dc: req.key.dc,
                                }),
                            }),
                        )
                        resolve(response)
                    } catch (err) {
                        this.handleErrorResponseForMethod(
                            err,
                            'PUT',
                            resolve,
                            reject,
                        )
                    }
                })
            case RequestType.DeleteRequest:
                return new Promise(async (resolve, reject) => {
                    try {
                        const response = await got(
                            this.getPathForRequest(req),
                            deepMerge(options, {
                                method: 'DELETE',
                                headers: headersForRequest(req),
                                searchParams: cleanQueryParams({
                                    dc: req.key.dc,
                                }),
                            }),
                        )
                        resolve(response)
                    } catch (err) {
                        this.handleErrorResponseForMethod(
                            err,
                            'DELETE',
                            resolve,
                            reject,
                        )
                    }
                })
            default:
                const msg: never = req
                return Promise.reject(
                    new Error(`Unsupported request type: ${msg}`),
                )
        }
    }

    protected getPathForRequest(req: KVRequest): string {
        return `${this.currentDestination}/${requestToPath(req)}`
    }

    protected handleErrorResponseForMethod(
        err: unknown,
        method: string,
        resolve: (
            value: Response<unknown> | PromiseLike<Response<unknown>>,
        ) => void,
        reject: (reason?: any) => void,
    ) {
        if (err instanceof HTTPError) {
            // Allow non 2xx/3xx responses to resolve upstream
            resolve(err.response)
        } else {
            logger.error(
                `Unexpected error on ${method}: ${
                    err instanceof Error ? err.message : err
                }`,
            )
            reject(err)
        }
    }
}
