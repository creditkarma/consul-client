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

export function arraysAreEqual(arr1: Array<any>, arr2: Array<any>): boolean {
    if (arr1.length !== arr2.length) {
        return false

    } else {
        for (const item of arr1) {
            if (arr2.indexOf(item) === -1) {
                return false
            }
        }

        return true
    }
}

export function deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
        return true

    } else {
        const obj1Type: string = typeof obj1
        const obj2Type: string = typeof obj2

        if (obj1Type !== obj2Type) {
            return false

        } else {
            switch (obj1Type) {
                case 'string':
                case 'number':
                case 'boolean':
                case 'symbol':
                    return false

                default:
                    if (obj1 === null || obj2 === null) {
                        return false
                    } else {
                        const obj1Keys: Array<string> = Object.keys(obj1)
                        const obj2Keys: Array<string> = Object.keys(obj2)

                        if (!arraysAreEqual(obj1Keys, obj2Keys)) {
                            return false

                        } else {
                            for (const key of obj1Keys) {
                                if (!deepEqual(obj1[key], obj2[key])) {
                                    return false
                                }
                            }

                            return true
                        }
                    }
            }
        }
    }
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
