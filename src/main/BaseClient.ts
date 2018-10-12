import { CoreOptions, RequestResponse } from 'request'
import { DEFAULT_HOST } from './constants'
import {
    ensureProtocol,
    removeLeadingTrailingSlash,
} from './utils'

import * as logger from './logger'
import { IConsulClient } from './types'

const RETRY_INTERVAL: number = 1000

export abstract class BaseClient<ConsulRequest> implements IConsulClient<ConsulRequest> {
    protected destinations: Array<string>
    protected currentDestination: string
    protected currentIndex: number = 0
    constructor(destinations: Array<string> = [ DEFAULT_HOST ]) {
        this.destinations = destinations.map((next: string) => {
            return ensureProtocol(removeLeadingTrailingSlash(next))
        })

        this.currentDestination = this.destinations[this.currentIndex]
    }

    public send(req: ConsulRequest, options: CoreOptions = {}): Promise<RequestResponse> {
        const dest: string = this.currentDestination
        return this.processRequest(req, options).catch((err: any) => this.runRetry(req, options, dest, err))
    }

    protected runRetry(req: ConsulRequest, options: CoreOptions, dest: string, err: any): Promise<RequestResponse> {
        return new Promise((resolve, reject) => {
            if (this.currentIndex < this.destinations.length - 1 || dest !== this.currentDestination) {
                logger.warn(`Request failed on host[${this.currentDestination}]. ${err.message}. Trying next host. `)

                if (dest === this.currentDestination) {
                    this.currentIndex += 1
                    this.currentDestination = this.destinations[this.currentIndex]
                }

                setTimeout(() => {
                    resolve(this.send(req, options))
                }, RETRY_INTERVAL)
            } else {
                this.currentIndex = 0
                return reject(err)
            }
        })
    }

    protected abstract processRequest(req: ConsulRequest, options?: CoreOptions): Promise<RequestResponse>

    protected abstract getPathForRequest(req: ConsulRequest): string
}
