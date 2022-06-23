import { OptionsOfJSONResponseBody, Response } from 'got'
import { DEFAULT_HOST } from './constants'
import { ensureProtocol, removeLeadingTrailingSlash } from './utils'

import * as logger from './logger'
import { IConsulClient } from './types'

const RETRY_INTERVAL: number = 1000

export abstract class BaseClient<ConsulRequest>
    implements IConsulClient<ConsulRequest>
{
    protected destinations: Array<string>
    protected currentDestination: string
    protected currentIndex: number = 0
    constructor(destinations: Array<string> = [DEFAULT_HOST]) {
        this.destinations = destinations.map((next: string) => {
            return ensureProtocol(removeLeadingTrailingSlash(next))
        })

        this.currentDestination = this.destinations[this.currentIndex]
    }

    public send(
        req: ConsulRequest,
        options: OptionsOfJSONResponseBody = {},
    ): Promise<Response> {
        const dest: string = this.currentDestination
        return this.processRequest(req, options).catch((err: any) =>
            this.runRetry(req, options, dest, err),
        )
    }

    protected runRetry(
        req: ConsulRequest,
        options: OptionsOfJSONResponseBody,
        dest: string,
        err: any,
    ): Promise<Response> {
        return new Promise((resolve, reject) => {
            if (
                this.currentIndex < this.destinations.length - 1 ||
                dest !== this.currentDestination
            ) {
                logger.warn(
                    `Request failed on host[${this.currentDestination}]. ${err.message}. Trying next host. `,
                )

                if (dest === this.currentDestination) {
                    this.currentIndex += 1
                    this.currentDestination =
                        this.destinations[this.currentIndex]
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

    protected abstract processRequest(
        req: ConsulRequest,
        options?: OptionsOfJSONResponseBody,
    ): Promise<Response>

    protected abstract getPathForRequest(req: ConsulRequest): string
}
