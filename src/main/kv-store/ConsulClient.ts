import { CoreOptions, RequestResponse } from 'request'
import * as rpn from 'request-promise-native'

import { KVRequest, RequestType } from './types'

import {
    cleanQueryParams,
    deepMerge,
    removeLeadingTrailingSlash,
    requestToPath,
} from '../utils'

import {
    CONSUL_HOST_NAME,
    CONSUL_INDEX_HEADER,
    CONSUL_TOKEN_HEADER,
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

function headersForRequest(req: KVRequest): IHeaderMap {
    const headers: IHeaderMap = {
        host: CONSUL_HOST_NAME,
    }

    if (req.index) {
        headers[CONSUL_INDEX_HEADER] = req.index + 1
    }

    if (req.token) {
        headers[CONSUL_TOKEN_HEADER] = req.token
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
