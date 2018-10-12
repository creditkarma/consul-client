# Consul Client

A client for Hashicorp Consul written in TypeScript.

This library currently has clients to support the [Consul KV API](https://www.consul.io/api/kv.html) and the [Consul Catalog API](https://www.consul.io/api/catalog.html).

## Install

```sh
$ npm install --save @creditkarma/consul-client
```

## K/V Store

The K/V store provides a simple JS API for getting values in and out of Consul. This API is primarily exposed through the KvStore class.

```typescript
import { KvStore, IKey, Observer } from '@creditkarma/consul-client'

/**
 * Instantiate KvStore with location of Consul, default is localhost:8500.
 *
 * The argument is actually an array of locations in order to support fail over.
 */
const kvStore: KvStore = new KvStore([ 'http://localhost:8500' ])
```

### IKey

The KvStore reads, writes and deletes values with Consul based on `IKey` objects. These are objects with one required property and one optional property. The required property is `path`. The path is the key name to look up. The optional property is `dc`. The dc is the datacenter to read from. Per the Consul docs this will default to the datacenter of the agent being queried, specified by the host address.

```typescript
// Set value for key
kvStore.set({ path: 'key', dc: 'dc1' }, 'test').then((success: boolean) => {
  if (success) {
    // write was successful
  }
})

// Get current value of key
kvStore.get({ path: 'key', dc: 'dc1' }).then((val: string) => {
  // val === 'test'
})

// Watch a key for value changes
kvStore.watch({ path: 'key', dc: 'dc1' }).onValue((val: string) => {
  // runs anytime the value changes, initially fires with current value
})

// Stop watching a value
kvStore.unwatch({ path: 'key', dc: 'dc1' })

// Delete key from consul
kvStore.delete({ path: 'key', dc: 'dc1' }).then((success: boolean) => {
  if (success) {
    // delete was successful
  }
})
```

### Observer

An `Observer` is the object returned from a call to `watch`.

It has five public methods:

```typescript
const observer: Observer<string> = kvStore.watch({ path: 'key', dc: 'dc1' })

observer.onValue((val: string) => {
    // runs anytime the value changes, initially fires with current value
})

observer.onError((err: Error) => {
    // runs anytime there is an error updating the value.
    // depending on the error the library may continue watching the key.
})

observer.current() // Returns the current value

observer.previous() // Returns the previous value

observer.destroy() // Nulls out all internal state

// Get the current value, returns null if no value
const currentVal: string | null = observer.current()

// Get the previous value, returns null in no previous value
const previousVal: string | null = observer.previous()
```

### Request Options

We use [Request](https://github.com/request/request) as our underlying HTTP client. As such you can pass options through to Request to customize the HTTP request for your environment. This can be done both when instantiating a new KvStore or when making a request.

```typescript
const kvStore: KvStore = new KvStore([ 'http://localhost:8500' ], { headers: { ... } })

kvStore.get({ path: 'key' }, { headers: { ... } })
```

The options given to the KvStore constructor are used on every request. Options given to a method are only used for that request. Options passed to a request method are deep merged with the instance options before performing the request.

Available [Options](https://github.com/request/request#requestoptions-callback)

## Catalog

The Catalog API allows you to discover other assets registered with your Consul instance. This is useful for service discovery.

```typescript
import { Catalog } from '@creditkarma/consul-client'

/**
 * Instantiate Catalog with location of Consul, default is localhost:8500
 *
 * Like KvStore the Catalog supports fail over by providing a list of addresses.
 */
const catalog: Catalog = new Catalog([ 'http://localhost:8500' ])
```

### API Overview

```typescript
// List all nodes registered with Consul
catalog.listNodes().then((res: Array<INodeDescription>) => {
    // Do something
})

// List all services registered with Consul
catalog.listServices().then((res: IServiceMap) => {
    // Do something
})

// List all nodes registered with a given service
catalog.listNodesForService('service-name').then((res: IServiceMap) => {
    // Do something
})

// Get the registered address for a given service
catalog.resolveAddress('service-name').then((res: string) => {
    // Do something
})

// Watch for runtime changes to a service address
catalog.watchAddress('service-name').onValue((res: string) => {
    // Do something
})
```

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](https://github.com/creditkarma/CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)
