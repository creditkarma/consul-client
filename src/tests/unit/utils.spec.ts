import { expect } from 'code'
import * as Lab from 'lab'
import { IQueryMap } from '../../main/types'
import * as Utils from '../../main/utils'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('Utils', () => {
    describe('splitQueryMap', () => {
        it('should split query string to map', async () => {
            const actual: IQueryMap = Utils.splitQueryMap('hvault?dc=dc1')
            const expected: IQueryMap = {
                dc: 'dc1',
            }

            expect<IQueryMap>(actual).to.equal(expected)
        })

        it('should handle multiple values', async () => {
            const actual: IQueryMap = Utils.splitQueryMap('hvault?dc=dc1&near=blah&service=my-service')
            const expected: IQueryMap = {
                dc: 'dc1',
                near: 'blah',
                service: 'my-service',
            }

            expect<IQueryMap>(actual).to.equal(expected)
        })

        it('should return empty map for no query params', async () => {
            const actual: IQueryMap = Utils.splitQueryMap('hvault?')
            const expected: IQueryMap = {}

            expect<IQueryMap>(actual).to.equal(expected)
        })
    })

    describe('deepMerge', () => {
        it('should merge two objects', async () => {
            const obj1 = { foo: 'bar' }
            const obj2 = { one: 'two' }
            const expected = { foo: 'bar', one: 'two' }
            const actual = Utils.deepMerge(obj1, obj2)

            expect(actual).to.equal(expected)
        })

        it('should perform a deep merge on two objects', async () => {
            const obj1 = {
                foo: 'bar',
                obj: {
                    one: 'one',
                    three: 'three',
                },
            }
            const obj2 = {
                obj: {
                    one: 'two',
                    four: 'four',
                },
            }
            const expected = {
                foo: 'bar',
                obj: {
                    one: 'two',
                    three: 'three',
                    four: 'four',
                },
            }
            const actual = Utils.deepMerge(obj1, obj2)

            expect(actual).to.equal(expected)
        })
    })

    describe('removeLeadingTrailingSlash', () => {
        it('should remove both leading and trailing slash from string', async () => {
            const testStr: string = '/what am i doing here?/'
            const actual: string = Utils.removeLeadingTrailingSlash(testStr)
            const expected: string = 'what am i doing here?'

            expect(actual).to.equal(expected)
        })

        it('should remove trailing slash from string', async () => {
            const testStr: string = 'what am i doing here?/'
            const actual: string = Utils.removeLeadingTrailingSlash(testStr)
            const expected: string = 'what am i doing here?'

            expect(actual).to.equal(expected)
        })

        it('should remove leading slash from string', async () => {
            const testStr: string = '/what am i doing here?'
            const actual: string = Utils.removeLeadingTrailingSlash(testStr)
            const expected: string = 'what am i doing here?'

            expect(actual).to.equal(expected)
        })

        it('should leave other strings unaltered', async () => {
            const testStr: string = 'what am i doing here?'
            const actual: string = Utils.removeLeadingTrailingSlash(testStr)
            const expected: string = 'what am i doing here?'

            expect(actual).to.equal(expected)
        })
    })

    describe('cleanQueryParams', () => {
        it('should remove false values from a key/value map', async () => {
            const testObj: IQueryMap = { key1: 'false', key2: 'true' }
            const actual: IQueryMap = Utils.cleanQueryParams(testObj)
            const expected: IQueryMap = { key2: 'true' }

            expect<IQueryMap>(actual).to.equal(expected)
        })

        it('should remove undefined values from a key/value map', async () => {
            const testObj: IQueryMap = { key1: 'one', key2: undefined, key3: 'test' }
            const actual: IQueryMap = Utils.cleanQueryParams(testObj)
            const expected: IQueryMap = { key1: 'one', key3: 'test' }

            expect<IQueryMap>(actual).to.equal(expected)
        })
    })

    describe('ensureProtocol', () => {
        it('should return existing url if it has a protocol', async () => {
            const url = 'http://localhost:8000'
            expect(Utils.ensureProtocol(url)).to.equal(url)
        })

        it('should add protocol if it is missing', async () => {
            const url = 'localhost:8000'
            expect(Utils.ensureProtocol(url)).to.equal('http://' + url)
        })
    })

    describe('deepEqual', () => {
        it('should return true for equal objects', async () => {
            expect(Utils.deepEqual({
                one: 1,
                two: {
                    three: 3,
                    four: 'four',
                },
            }, {
                one: 1,
                two: {
                    three: 3,
                    four: 'four',
                },
            })).to.equal(true)
        })

        it('should return true for equal arrays', async () => {
            expect(Utils.deepEqual([ 1, 2, [ 3, 4 ] ], [ 1, 2, [3, 4 ] ])).to.equal(true)
        })

        it('should return true for equal strings', async () => {
            expect(Utils.deepEqual('test', 'test')).to.equal(true)
        })

        it('should return false for objects that are not equal', async () => {
            expect(Utils.deepEqual({
                one: 1,
                two: {
                    three: 3,
                    four: 'four',
                },
            }, {
                one: 1,
                two: {
                    three: 3,
                    four: 'five',
                },
            })).to.equal(false)
        })

        it('should return false for arrays that are not equal', async () => {
            expect(Utils.deepEqual([ 1, 2, [ 3, 4 ] ], [ 1, 2, [ 6, 4 ] ])).to.equal(false)
        })

        it('should return false for strings that are not equal', async () => {
            expect(Utils.deepEqual('test', 'booya')).to.equal(false)
        })
    })
})
