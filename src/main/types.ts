import { OptionsOfJSONResponseBody, Response } from 'got'

export interface IQueryMap {
    index?: number
    dc?: string
    service?: string
    tag?: string
    near?: string
    'node-meta'?: string
    [key: string]: string | number | boolean | undefined
}

export interface IHeaderMap {
    [key: string]: string | undefined
}

export interface IConsulClient<ConsulRequest> {
    send(
        req: ConsulRequest,
        options?: OptionsOfJSONResponseBody,
    ): Promise<Response>
}
