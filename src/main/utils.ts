import * as url from 'url'
import { merge, isEqual } from 'lodash'

import {
    CONSUL_ADDRESS,
    CONSUL_DC,
    CONSUL_HOST_NAME,
    CONSUL_INDEX_HEADER,
    CONSUL_TOKEN_HEADER,
    DEFAULT_HOST,
} from './constants'

import { CatalogRequest } from './catalog/types'
import { IKVRequest, KVRequest } from './kv-store/types'
import { IHeaderMap, IQueryMap } from './types'

export function defaultAddresses(): Array<string> {
    const envAddress: string | undefined = process.env[CONSUL_ADDRESS]
    if (envAddress !== undefined) {
        return envAddress
            .split(',')
            .map((next: string) => {
                return next.trim()
            })
            .filter((next: string) => {
                return next !== ''
            })
    } else {
        return [DEFAULT_HOST]
    }
}

/**
 * Try to decode a base64 encoded string
 */
export function decodeBase64(val: string): any {
    return JSON.parse(Buffer.from(val, 'base64').toString('utf-8'))
}

export function removeLeadingTrailingSlash(str: string): string {
    const tmp: string =
        str.charAt(0) === '/' ? str.substring(1, str.length) : str

    if (tmp.charAt(tmp.length - 1) === '/') {
        return tmp.substring(0, tmp.length - 1)
    } else {
        return tmp
    }
}

export function ensureProtocol(urlVal: string): string {
    const protocols = ['http:', 'https:']
    const parsedUrl: url.Url = url.parse(urlVal)
    const hasProto = protocols.indexOf(parsedUrl.protocol || '') >= 0
    return hasProto ? urlVal : 'http://' + urlVal
}

export function splitQueryMap(raw: string): IQueryMap {
    const result: IQueryMap = {}
    const parts = raw.split('?').filter((next) => next.trim() !== '')

    if (parts.length > 1) {
        const query = parts[1]
        const pairs = query.split('&')
        pairs.forEach((next) => {
            const [key, value] = next.split('=')
            result[key] = value
        })
    }

    return result
}

export function cleanQueryParams(raw: IQueryMap): IQueryMap {
    const cleaned: IQueryMap = {}

    raw.dc = raw.dc || process.env[CONSUL_DC]

    for (const key in raw) {
        if (raw.hasOwnProperty(key)) {
            const value: any = raw[key]
            if (value !== undefined && value !== null && value !== 'false') {
                cleaned[key] = value
            }
        }
    }

    return cleaned
}

/**
 * Given a ConsulRequest construct a path to the desired resource
 */
export function requestToPath(req: IKVRequest): string {
    const tmp: string =
        req.subsection !== undefined
            ? `${req.apiVersion}/${req.section}/${req.subsection}/${req.key.path}`
            : `${req.apiVersion}/${req.section}/${req.key.path}`

    return removeLeadingTrailingSlash(tmp)
}

/**
 * Recursively combine the properties of two objects into a new object. In the event of roperties
 * with the same path in both object preference is given to the value in the second object.
 */
export function deepMerge<Base extends object, Update extends object>(
    base: Base,
    update: Update,
): Base & Update {
    return merge({}, base, update)
}

export function deepEqual(obj1: any, obj2: any): boolean {
    return isEqual(obj1, obj2)
}

export function headersForRequest(req: KVRequest | CatalogRequest): IHeaderMap {
    const headers: IHeaderMap = {
        host: CONSUL_HOST_NAME,
    }

    if (req.index !== undefined) {
        headers[CONSUL_INDEX_HEADER] = req.index + 1
    }

    if ((req as KVRequest).token) {
        headers[CONSUL_TOKEN_HEADER] = (req as KVRequest).token
    }

    return headers
}
