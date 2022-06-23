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
    protected async processRequest(
        req: KVRequest,
        options: OptionsOfJSONResponseBody = {},
    ): Promise<Response> {
        try {
            switch (req.type) {
                case RequestType.GetRequest:
                    return await got(
                        this.getPathForRequest(req),
                        deepMerge(options, {
                            method: 'GET',
                            headers: headersForRequest(req),
                            searchParams: cleanQueryParams({
                                dc: req.key.dc,
                                index: req.index,
                            }),
                            responseType: 'json',
                        }),
                    )
                case RequestType.UpdateRequest:
                    return await got(
                        this.getPathForRequest(req),
                        deepMerge(options, {
                            body: Buffer.from(JSON.stringify(req.value)),
                            method: 'PUT',
                            headers: headersForRequest(req),
                            searchParams: cleanQueryParams({
                                dc: req.key.dc,
                            }),
                            responseType: 'json',
                        }),
                    )
                case RequestType.DeleteRequest:
                    return await got(
                        this.getPathForRequest(req),
                        deepMerge(options, {
                            method: 'DELETE',
                            headers: headersForRequest(req),
                            searchParams: cleanQueryParams({
                                dc: req.key.dc,
                            }),
                            responseType: 'json',
                        }),
                    )
                default:
                    const msg: never = req
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

    protected getPathForRequest(req: KVRequest): string {
        return `${this.currentDestination}/${requestToPath(req)}`
    }
}
