import { expect } from '@hapi/code'
import * as Lab from '@hapi/lab'
import { KvStore } from '../../main'

export const lab = Lab.script()

const describe = lab.describe
const it = lab.it

describe('KvStore', () => {
    const mockObj = { value: 'bar' }
    const mockStr = 'test me'
    const mockNum = 5
    const mockBool = true

    /*
    Note - Client max retries is set to '0' since there are currently no tests
    formally engaging retry logic
    */
    describe('With standard config', () => {
        const client = new KvStore(['http://127.0.0.1:8500'], {}, 0)

        describe('set', () => {
            it('should write a string to consul', async () => {
                return client.set({ path: 'str' }, mockStr).then((val: any) => {
                    expect(val).to.equal(true)
                })
            })

            it('should write a number to consul', async () => {
                return client.set({ path: 'num' }, mockNum).then((val: any) => {
                    expect(val).to.equal(true)
                })
            })

            it('should write a boolean to consul', async () => {
                return client
                    .set({ path: 'bool' }, mockBool)
                    .then((val: any) => {
                        expect(val).to.equal(true)
                    })
            })

            it('should write an object to consul', async () => {
                return client.set({ path: 'obj' }, mockObj).then((val: any) => {
                    expect(val).to.equal(true)
                })
            })
        })

        describe('get', () => {
            it('should read a string from consul', async () => {
                client.get({ path: 'str' }).then((val: any) => {
                    expect(val).to.equal(mockStr)
                })
            })

            it('should read a number from consul', async () => {
                client.get({ path: 'num' }).then((val: any) => {
                    expect(val).to.equal(mockNum)
                })
            })

            it('should read a boolean from consul', async () => {
                return client.get({ path: 'bool' }).then((val: any) => {
                    expect(val).to.equal(mockBool)
                })
            })

            it('should read an object from consul', async () => {
                return client.get({ path: 'obj' }).then((val: any) => {
                    expect(val).to.equal(mockObj)
                })
            })

            it('should return null for a missing key', async () => {
                return client.get({ path: 'missing' }).then((val: any) => {
                    expect(val).to.equal(null)
                })
            })
        })

        describe('watch', () => {
            it('should return an observer that updates any time the value updates', async () => {
                return new Promise((resolve, reject) => {
                    let count: number = 0

                    client
                        .watch<string>({ path: 'str' })
                        .onValue((val: string): void => {
                            if (count === 0) {
                                expect(val).to.equal(mockStr)
                                setTimeout(() => {
                                    client.set({ path: 'str' }, 'updated-str')
                                }, 1000)
                            } else if (count === 1) {
                                expect(val).to.equal('updated-str')
                                setTimeout(() => {
                                    client.set({ path: 'str' }, 'updated-again')
                                }, 1000)
                            } else if (count === 2) {
                                expect(val).to.equal('updated-again')
                                resolve()
                            } else {
                                throw new Error('Nope')
                            }

                            count++
                        })
                })
            })

            it('should return an observer that only updates when the new value is different', async () => {
                return new Promise((resolve, reject) => {
                    let count: number = 0
                    let updateCount: number = 0

                    client
                        .watch<object>({ path: 'obj' })
                        .onValue((val: object): void => {
                            if (count === 0) {
                                expect(val).to.equal(mockObj)
                            } else if (count === 1) {
                                expect(val).to.equal({ value: 'updated' })
                            } else if (count === 2) {
                                expect(val).to.equal({ value: 'again' })
                            } else if (count === 3) {
                                expect(val).to.equal({ value: 'finally' })
                                resolve()
                            } else {
                                throw new Error('Nope')
                            }

                            count++
                        })

                    function runUpdate() {
                        setTimeout(() => {
                            if (updateCount === 0) {
                                client.set(
                                    { path: 'obj' },
                                    { value: 'updated' },
                                )
                            } else if (updateCount === 1) {
                                client.set({ path: 'obj' }, { value: 'again' })
                            } else if (updateCount === 2) {
                                client.set({ path: 'obj' }, { value: 'again' })
                            } else if (updateCount === 3) {
                                client.set(
                                    { path: 'obj' },
                                    { value: 'finally' },
                                )
                            }

                            if (updateCount < 3) {
                                updateCount += 1
                                runUpdate()
                            }
                        }, 2000)
                    }

                    runUpdate()
                })
            })

            it('should return an observer that performs retries for errors', async () => {
                return new Promise((resolve, reject) => {
                    let count: number = 0

                    client
                        .watch<string>({ path: 'missing?wait=1s' })
                        .onValue((val: string): void => {
                            if (count === 0) {
                                expect(val).to.equal('initial-val')
                                setTimeout(() => {
                                    client.set(
                                        { path: 'missing' },
                                        'updated-str',
                                    )
                                }, 1000)
                            } else if (count === 1) {
                                expect(val).to.equal('updated-str')
                                setTimeout(() => {
                                    client.set(
                                        { path: 'missing' },
                                        'updated-again',
                                    )
                                }, 1000)
                            } else if (count === 2) {
                                expect(val).to.equal('updated-again')
                                resolve()
                            } else {
                                throw new Error('Nope')
                            }

                            count++
                        })

                    setTimeout(() => {
                        client.set({ path: 'missing' }, 'initial-val')
                    }, 1000)
                })
            })
        })

        describe('delete', () => {
            it('should delete a string from consul', async () => {
                return client.delete({ path: 'str' }).then((result: any) => {
                    expect(result).to.equal(true)
                    return client.get({ path: 'str' }).then((val: any) => {
                        expect(val).to.equal(null)
                    })
                })
            })

            it('should delete a number from consul', async () => {
                return client.delete({ path: 'num' }).then((result: any) => {
                    expect(result).to.equal(true)
                    return client.get({ path: 'num' }).then((val: any) => {
                        expect(val).to.equal(null)
                    })
                })
            })

            it('should delete a boolean from consul', async () => {
                return client.delete({ path: 'bool' }).then((result: any) => {
                    expect(result).to.equal(true)
                    return client.get({ path: 'bool' }).then((val: any) => {
                        expect(val).to.equal(null)
                    })
                })
            })

            it('should delete an object from consul', async () => {
                return client.delete({ path: 'obj' }).then((result: any) => {
                    expect(result).to.equal(true)
                    return client.get({ path: 'obj' }).then((val: any) => {
                        expect(val).to.equal(null)
                    })
                })
            })

            it('should return true for a missing key', async () => {
                return client
                    .delete({ path: 'missing' })
                    .then((result: any) => {
                        expect(result).to.equal(true)
                    })
            })
        })
    })

    describe('With fail over', () => {
        const failOverClient = new KvStore(
            ['127.0.0.1:9000', '127.0.0.1:8500'],
            {},
            0,
        )

        describe('write', () => {
            it('should write a string to consul', async () => {
                return failOverClient
                    .set({ path: 'str' }, mockStr)
                    .then((val: any) => {
                        expect(val).to.equal(true)
                    })
            })
        })

        describe('read', () => {
            it('should read a string from consul', async () => {
                failOverClient.get({ path: 'str' }).then((val: any) => {
                    expect(val).to.equal(mockStr)
                })
            })
        })

        describe('delete', () => {
            it('should delete a string from consul', async () => {
                return failOverClient
                    .delete({ path: 'str' })
                    .then((result: any) => {
                        expect(result).to.equal(true)
                        return failOverClient
                            .get({ path: 'str' })
                            .then((val: any) => {
                                expect(val).to.equal(null)
                            })
                    })
            })
        })
    })

    describe('With only invalid clients', () => {
        const failOverClient = new KvStore(
            ['127.0.0.1:9000', '127.0.0.1:9500'],
            {},
            0,
        )

        describe('write', () => {
            it('should reject', async () => {
                return failOverClient.set({ path: 'str' }, mockStr).then(
                    (val: any) => {
                        throw new Error('Should reject')
                    },
                    (err: any) => {
                        expect(err.message).to.equal(
                            'Error: connect ECONNREFUSED 127.0.0.1:9500',
                        )
                    },
                )
            })
        })

        describe('read', () => {
            it('should reject', async () => {
                failOverClient.get({ path: 'str' }).then(
                    (val: any) => {
                        throw new Error('Should reject')
                    },
                    (err: any) => {
                        expect(err.message).to.equal(
                            'Error: connect ECONNREFUSED 127.0.0.1:9500',
                        )
                    },
                )
            })
        })

        describe('delete', () => {
            it('should reject', async () => {
                return failOverClient.delete({ path: 'str' }).then(
                    (val: any) => {
                        throw new Error('Should reject')
                    },
                    (err: any) => {
                        expect(err.message).to.equal(
                            'Error: connect ECONNREFUSED 127.0.0.1:9500',
                        )
                    },
                )
            })
        })

        describe('watch', () => {
            it('should reject', async () => {
                return failOverClient
                    .watch<string>({ path: 'str' })
                    .onValue((val: any) => {
                        throw new Error('Should reject')
                    })
                    .onError((err) => {
                        expect(err.message).to.equal(
                            'Error: connect ECONNREFUSED 127.0.0.1:9500',
                        )
                    })
            })
        })
    })

    describe('When configured with no protocol', () => {
        const shortClient = new KvStore(['127.0.0.1:8500'], {}, 0)

        describe('write', () => {
            it('should write a string to consul', async () => {
                return shortClient
                    .set({ path: 'str' }, mockStr)
                    .then((val: any) => {
                        expect(val).to.equal(true)
                    })
            })
        })

        describe('delete', () => {
            it('should delete a string from consul', async () => {
                return shortClient
                    .delete({ path: 'str' })
                    .then((result: any) => {
                        expect(result).to.equal(true)
                        return shortClient
                            .get({ path: 'str' })
                            .then((val: any) => {
                                expect(val).to.equal(null)
                            })
                    })
            })
        })
    })
})
