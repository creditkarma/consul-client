import * as url from 'url'

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
        return envAddress.split(',').map((next: string) => {
            return next.trim()
        }).filter((next: string) => {
            return next !== ''
        })
    } else {
        return [ DEFAULT_HOST ]
    }
}

/**
 * Try to decode a base64 encoded string
 */
export function decodeBase64(val: string): any {
    return JSON.parse(Buffer.from(val, 'base64').toString('utf-8'))
}

export function removeLeadingTrailingSlash(str: string): string {
    const tmp: string = str.charAt(0) === '/' ? str.substring(1, str.length) : str

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

function isObject(obj: any): boolean {
    return obj !== null && typeof obj === 'object'
}

/**
 * Recursively combine the properties of two objects into a new object. In the event of roperties
 * with the same path in both object preference is given to the value in the second object.
 */
export function deepMerge<Base, Update>(base: Base, update: Update): Base & Update {
    const newObj: any = {}
    const baseKeys: Array<string> = Object.keys(base)
    const updateKeys: Array<string> = Object.keys(update)

    for (const key of updateKeys) {
        if (baseKeys.indexOf(key) === -1) {
            baseKeys.push(key)
        }
    }

    for (const key of baseKeys) {
        if (base.hasOwnProperty(key) || update.hasOwnProperty(key)) {
            const baseValue: any = (base as any)[key]
            const updateValue: any = (update as any)[key]
            if (isObject(baseValue) && isObject(updateValue)) {
                newObj[key] = deepMerge(baseValue, updateValue)

            } else if (updateValue !== undefined) {
                newObj[key] = updateValue

            } else {
                newObj[key] = baseValue
            }
        }
    }

    return newObj as Base & Update
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
