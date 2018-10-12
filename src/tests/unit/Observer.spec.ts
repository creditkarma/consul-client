import { expect } from 'code'
import * as Lab from 'lab'
import { Observer } from '../../main'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('Observer', () => {
    describe('create', () => {
        it('should create an Observer with given value', async () => {
            const ob: Observer<string> = Observer.create('test')
            const actual: string = ob.current() || 'failed'
            const expected: string = 'test'

            expect<string>(actual).to.equal(expected)
        })
    })

    describe('onValue', () => {
        it('should alert callback if Observer has value', (done) => {
            const ob: Observer<string> = Observer.create('test')
            const expected: string = 'test'

            ob.onValue((val: string) => {
                expect<string>(val).to.equal(expected)
                done()
            })
        })

        it('should alert callback when Observer is updated', (done) => {
            const expected: string = 'foo'
            const ob: Observer<string> = new Observer((sink) => {
                setTimeout(() => {
                    sink(undefined, expected)
                })
            })

            ob.onValue((val: string) => {
                expect<string>(val).to.equal(expected)
                done()
            })
        })
    })
})
