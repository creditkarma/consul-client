import { CoreOptions, RequestResponse} from 'request'

export interface IQueryMap {
    index?: number
    dc?: string
    service?: string
    tag?: string
    near?: string
    'node-meta'?: string
    [key: string]: string | number | undefined
}

export interface IHeaderMap {
    [key: string]: string | number | undefined
}

export interface IConsulClient<ConsulRequest> {
    send(req: ConsulRequest, options?: CoreOptions): Promise<RequestResponse>
}
