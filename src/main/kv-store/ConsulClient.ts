import { CoreOptions, RequestResponse } from 'request'
import * as rpn from 'request-promise-native'

import { KVRequest, RequestType } from './types'

import {
    cleanQueryParams,
    deepMerge,
    ensureProtocol,
    headersForRequest,
    removeLeadingTrailingSlash,
    requestToPath,
} from '../utils'

import { DEFAULT_ADDRESS } from '../constants'

const request = rpn.defaults({
    json: true,
    simple: false,
    resolveWithFullResponse: true,
})

export class ConsulClient {
    private destination: string
    constructor(dest?: string) {
        this.destination =
            dest !== undefined ?
                removeLeadingTrailingSlash(dest) :
                removeLeadingTrailingSlash(DEFAULT_ADDRESS)

        this.destination = ensureProtocol(this.destination)
    }

    public send(req: KVRequest, options: CoreOptions = {}): Promise<RequestResponse> {
        switch (req.type) {
            case RequestType.GetRequest:
                return request(
                    deepMerge(options, {
                        uri: this.uriForRequest(req),
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
                        uri: this.uriForRequest(req),
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
                        uri: this.uriForRequest(req),
                        method: 'DELETE',
                        headers: headersForRequest(req),
                        qs: cleanQueryParams({
                            dc: req.key.dc,
                        }),
                    }),
                ).promise()

            default:
                const msg: never = req
                return Promise.reject(new Error(`Unsupported request type: ${msg}`))
        }
    }

    private uriForRequest(req: KVRequest): string {
        return `${this.destination}/${requestToPath(req)}`
    }
}
