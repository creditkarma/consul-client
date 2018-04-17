import { expect } from 'code'
import * as Lab from 'lab'
import { Catalog } from '../../main'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('KvStore', () => {
    const client = new Catalog('http://127.0.0.1:8500')

    it('should register a service to a given node', async () => {
        return client.registerEntity({
            Node: 'bango',
            Address: '192.168.4.19',
            Service: {
                Service: 'my-thing',
                Address: '127.0.0.1',
            },
        }).then((success: boolean) => {
            expect(success).to.equal(true)
        })
    })

    it('should list available services', async () => {
        return client.listServices().then((services: any) => {
            expect(services).to.equal({ 'consul': [], 'my-thing': [] })
        })
    })

    it('should resolve address for given service', async () => {
        return client.resolveAddress('my-thing').then((address: string) => {
            expect(address).to.equal('127.0.0.1')
        })
    })
})
