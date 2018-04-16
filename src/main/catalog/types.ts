export const enum CatalogRequestType {
    ListNodesRequest = 'ListNodesRequest',
    ListDatacentersRequest = 'ListDatacentersRequest',
    ListServicesRequest = 'ListServicesRequest',
    ListServiceNodesRequest = 'ListServiceNodesRequest',
    ListNodeServicesRequest = 'ListNodeServicesRequest',
    RegisterEntityRequest = 'RegisterEntityRequest',
    DeregisterEntityRequest = 'DeregisterEntityRequest',
}

export interface IQueryMap {
    [key: string]: string | number | boolean | undefined
}

export interface ICatalogRequest {
    type: CatalogRequestType
    apiVersion: 'v1'
    section: 'catalog'
}

export interface IConsulMetadata {
    CreateIndex: number
    ModifyIndex: number
    LockIndex: number
    Key: string
    Flags: number
    Value: string // base-64 encoded
    Session: string
}

export interface IListNodesRequest extends ICatalogRequest {
    type: CatalogRequestType.ListNodesRequest
}

export interface IListDatacentersRequest<T = any> extends ICatalogRequest {
    type: CatalogRequestType.ListDatacentersRequest
    value: T
}

export interface IListServicesRequest extends ICatalogRequest {
    type: CatalogRequestType.ListServicesRequest
}

export interface IListNodeServicesRequest extends ICatalogRequest {
    type: CatalogRequestType.ListNodeServicesRequest
}

export interface IListServiceNodesRequest extends ICatalogRequest {
    type: CatalogRequestType.ListServiceNodesRequest
    serviceName: string
}

export interface ITaggedAddresses {
    [name: string]: string
}

export interface INodeMeta {
    [key: string]: string
}

export interface IServiceMeta {
    [key: string]: string
}

export interface IService {
    ID?: string
    Service: string
    Tags?: Array<string>
    Address?: string
    Meta?: INodeMeta
    Port?: number
}

export interface IDefinition {
    TCP: string
    Interval: string
    Timeout: string
    DeregisterCriticalServiceAfter: string
}

export interface ICheck {
    Node: string
    CheckID: string
    Name: string
    Notes: string
    Status: string
    ServiceID: string
    Definition: IDefinition
}

export interface IRegisterEntityPayload {
    Datacenter?: string
    ID?: string
    Node: string
    Address: string
    TaggedAddresses?: ITaggedAddresses
    NodeMeta?: INodeMeta
    Service?: IService
    Check?: ICheck
    SkipNodeUpdate?: boolean
}

export interface IRegisterEntityRequest extends ICatalogRequest {
    type: CatalogRequestType.RegisterEntityRequest
    paylaod: IRegisterEntityPayload
}

export interface IDeregisterEntityRequest extends ICatalogRequest {
    type: CatalogRequestType.DeregisterEntityRequest
}

export type CatalogRequest =
    IListNodesRequest |
    IListDatacentersRequest |
    IListServicesRequest |
    IListNodeServicesRequest |
    IListServiceNodesRequest |
    IRegisterEntityRequest |
    IDeregisterEntityRequest

export interface IDeregisterResponse {
    Node: string
    Datacenter?: string
    CheckID?: string
    ServiceID?: string
}

export interface INodeDescription {
    ID: string
    Node: string
    Address: string
    Datacenter: string
    TaggedAddresses: ITaggedAddresses
    Meta: INodeMeta
}

export interface IServiceDescription {
    ID: string
    Node: string
    Address: string
    Datacenter: string
    TaggedAddresses: ITaggedAddresses
    NodeMeta: INodeMeta
    CreatedIndex: number
    ModifyIndex: number
    ServiceAddress?: string
    ServiceEnableTagOverride: boolean
    ServiceID: string
    ServiceName: string
    ServicePort: number
    ServiceMeta: IServiceMeta
    ServiceTags: Array<string>
}

export interface IServiceList {
    [name: string]: Array<string>
}

export interface IServiceMap {
    [name: string]: IServiceDescription
}

export interface INodeServicesResponse {
    Node: INodeDescription
    Services: IServiceMap
}
