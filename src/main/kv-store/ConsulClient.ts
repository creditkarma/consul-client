import { CoreOptions, RequestResponse } from 'request'
import * as rpn from 'request-promise-native'

import { KVRequest, RequestType } from './types'

import {
    cleanQueryParams,
    deepMerge,
    headersForRequest,
    requestToPath,
} from '../utils'

import { BaseClient } from '../BaseClient'

const request = rpn.defaults({
    json: true,
    simple: false,
    resolveWithFullResponse: true,
})

export class ConsulClient extends BaseClient<KVRequest> {
    protected processRequest(
        req: KVRequest,
        options: CoreOptions,
    ): Promise<RequestResponse> {
        switch (req.type) {
            case RequestType.GetRequest:
                return request(
                    deepMerge(options, {
                        uri: this.getPathForRequest(req),
                        method: 'GET',
                        headers: headersForRequest(req),
                        qs: cleanQueryParams({
                            dc: req.key.dc,
                            index: req.index,
                        }),
                    }),
                ).promise()

            case RequestType.UpdateRequest:
                return request(
                    deepMerge(options, {
                        uri: this.getPathForRequest(req),
                        body: req.value,
                        method: 'PUT',
                        headers: headersForRequest(req),
                        qs: cleanQueryParams({
                            dc: req.key.dc,
                        }),
                    }),
                ).promise()

            case RequestType.DeleteRequest:
                return request(
                    deepMerge(options, {
                        uri: this.getPathForRequest(req),
                        method: 'DELETE',
                        headers: headersForRequest(req),
                        qs: cleanQueryParams({
                            dc: req.key.dc,
                        }),
                    }),
                ).promise()

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
