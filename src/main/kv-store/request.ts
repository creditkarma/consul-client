import {
    IConsulDeleteRequest,
    IConsulGetRequest,
    IConsulUpdateRequest,
    RequestType,
} from './types'

export const DEFAULT_GET_REQUEST: IConsulGetRequest = {
    type: RequestType.GetRequest,
    apiVersion: 'v1',
    section: 'kv',
    subsection: undefined,
    index: undefined,
    key: { path: '' },
    token: '',
}

function merge<T>(...objs: Array<any>): T {
    const newObj: any = {}

    for (let i = 0; i < objs.length; i++) {
        const nextObj = objs[i]
        for (const key in nextObj) {
            if (nextObj.hasOwnProperty(key)) {
                newObj[key] = nextObj[key]
            }
        }
    }

    return newObj
}

export function getRequest(options: Partial<IConsulGetRequest>): IConsulGetRequest {
    return merge(DEFAULT_GET_REQUEST, options)
}

export const DEFAULT_UPDATE_REQUEST: IConsulUpdateRequest = {
    type: RequestType.UpdateRequest,
    apiVersion: 'v1',
    section: 'kv',
    subsection: undefined,
    index: undefined,
    key: { path: '' },
    value: '',
}

export function updateRequest(options: Partial<IConsulUpdateRequest>): IConsulUpdateRequest {
    return merge(DEFAULT_UPDATE_REQUEST, options)
}

export const DEFAULT_DELETE_REQUEST: IConsulDeleteRequest = {
    type: RequestType.DeleteRequest,
    apiVersion: 'v1',
    section: 'kv',
    subsection: undefined,
    index: '0',
    key: { path: '' },
}

export function deleteRequest(options: Partial<IConsulDeleteRequest>): IConsulDeleteRequest {
    return merge(DEFAULT_DELETE_REQUEST, options)
}
