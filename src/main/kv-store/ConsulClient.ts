import { OptionsOfJSONResponseBody, Response } from 'got'

import got from 'got'

import { KVRequest, RequestType } from './types'

import {
    cleanQueryParams,
    deepMerge,
    headersForRequest,
    requestToPath,
} from '../utils'

import { BaseClient } from '../BaseClient'
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
                        reject(err)
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
                        reject(err)
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
                        reject(err)
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
}
