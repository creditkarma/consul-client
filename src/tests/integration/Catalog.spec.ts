import { expect } from '@hapi/code'
import * as Lab from '@hapi/lab'
import { Catalog } from '../../main'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('KvStore', () => {
    describe('With standard config', () => {
        const client = new Catalog(['http://127.0.0.1:8500'])

        it('should register a service to a given node', async () => {
            await client.registerEntity({
                Node: 'bango',
                Address: '192.168.4.19',
                Service: {
                    ID: 'my-thing2',
                    Service: 'my-thing',
                    Address: '127.0.0.2',
                    Port: 8090,
                },
                Check: {
                    Node: 'bango',
                    CheckID: 'service:my-thing2',
                    Name: 'test service health check',
                    Status: 'critical',
                    ServiceID: 'my-thing2',
                    Definition: {
                        TCP: 'localhost:8888',
                        Interval: '5s',
                        Timeout: '1s',
                        DeregisterCriticalServiceAfter: '30s',
                    },
                },
            })
            return client
                .registerEntity({
                    Node: 'bango',
                    Address: '192.168.4.19',
                    Service: {
                        ID: 'my-thing1',
                        Service: 'my-thing',
                        Address: '127.0.0.1',
                        Port: 8080,
                    },
                    Check: {
                        CheckID: 'service:my-thing1',
                        Status: 'passing',
                        ServiceID: 'my-thing1',
                    },
                })
                .then((success: boolean) => {
                    expect(success).to.equal(true)
                })
        })

        it('should list available services', async () => {
            return client.listServices().then((services: any) => {
                expect(services).to.equal({ consul: [], 'my-thing': [] })
            })
        })

        it('should resolve address for given service', async () => {
            return client.resolveAddress('my-thing').then((address: string) => {
                expect(address).to.equal('127.0.0.1:8080')
            })
        })

        it('should watch for changes to a service address', async () => {
            return new Promise<void>((resolve, reject) => {
                let count: number = 0
                client.watchAddress('my-thing').onValue((next: string) => {
                    if (count === 0) {
                        expect(next).to.equal('127.0.0.1:8080')

                        client.registerEntity({
                            Node: 'bango',
                            Address: '192.168.4.19',
                            Service: {
                                ID: 'my-thing1',
                                Service: 'my-thing',
                                Address: '192.145.6.12',
                                Port: 8082,
                            },
                        })
                    } else if (count === 1) {
                        expect(next).to.equal('192.145.6.12:8082')
                        resolve()
                    }

                    count += 1
                })
            })
        })

        it('should resolve to the node address if the service registered did not have address field', async () => {
            return client
                .registerEntity({
                    Node: 'bango',
                    Address: '192.168.4.19',
                    Service: {
                        ID: 'my-thing3',
                        Service: 'my-thing3',
                        Port: 8080,
                    },
                })
                .then((success: boolean) => {
                    expect(success).to.equal(true)
                    return client
                        .resolveAddress('my-thing3')
                        .then((address: string) => {
                            expect(address).to.equal('192.168.4.19:8080')
                        })
                })
        })

        it('should resolve to the node address and port to 80, if the service registered did not have address and port fields', async () => {
            return client
                .registerEntity({
                    Node: 'bango',
                    Address: '192.168.4.19',
                    Service: {
                        ID: 'my-thing3',
                        Service: 'my-thing3',
                    },
                })
                .then((success: boolean) => {
                    expect(success).to.equal(true)
                    return client
                        .resolveAddress('my-thing3')
                        .then((address: string) => {
                            expect(address).to.equal('192.168.4.19:80')
                        })
                })
        })
    })

    describe('With fail over', () => {
        const client = new Catalog(['127.0.0.1:9000', '127.0.0.1:8500'])

        it('should register a service to a given node', async () => {
            return client
                .registerEntity({
                    Node: 'bango',
                    Address: '192.168.4.19',
                    Service: {
                        ID: 'my-thing1',
                        Service: 'my-thing',
                        Address: '127.0.0.1',
                        Port: 8080,
                    },
                })
                .then((success: boolean) => {
                    expect(success).to.equal(true)
                })
        })

        it('should list available services', async () => {
            return client.listServices().then((services: any) => {
                expect(services).to.equal({
                    consul: [],
                    'my-thing': [],
                    'my-thing3': [],
                })
            })
        })

        it('should resolve address for given service', async () => {
            return client.resolveAddress('my-thing').then((address: string) => {
                expect(address).to.equal('127.0.0.1:8080')
            })
        })

        it('should watch for changes to a service address', async () => {
            return new Promise<void>((resolve, reject) => {
                let count: number = 0
                client.watchAddress('my-thing').onValue((next: string) => {
                    if (count === 0) {
                        expect(next).to.equal('127.0.0.1:8080')

                        client.registerEntity({
                            Node: 'bango',
                            Address: '192.168.4.19',
                            Service: {
                                ID: 'my-thing1',
                                Service: 'my-thing',
                                Address: '192.145.6.12',
                                Port: 8082,
                            },
                        })
                    } else if (count === 1) {
                        expect(next).to.equal('192.145.6.12:8082')
                        resolve()
                    }

                    count += 1
                })
            })
        })
    })
})
