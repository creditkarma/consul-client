import * as Utils from './utils'

export type ValueCallback<T> = (value: T) => void
export type ErrorCallback = (err: Error) => void
export type ValueSink<T> = (err: Error | undefined, value?: T) => boolean
export type UpdateFunction<T> = (sink: ValueSink<T>) => void

export class Observer<T> {
    public static create<T>(value: T): Observer<T> {
        return new Observer(() => {
            // Nothing to see here.
        }, value)
    }

    private _isActive: boolean
    private _value: T | null
    private _previous: T | null
    private _listeners: Array<ValueCallback<T>> = []
    private _errorListeners: Array<ErrorCallback> = []

    constructor(updater: UpdateFunction<T>, value?: T) {
        this._value = value || null
        this._previous = null
        this._isActive = true
        updater((err: Error | undefined, newValue?: T): boolean => {
            if (err !== undefined) {
                return this.updateErrors(err)
            } else if (newValue !== undefined) {
                return this.update(newValue)
            } else {
                return false
            }
        })
    }

    public destroy(): void {
        this._value = null
        this._isActive = false
        this._listeners = []
    }

    public previous(): T | null {
        return this._previous
    }

    public current(): T | null {
        return this._value
    }

    public onValue(cb: ValueCallback<T>): this {
        if (this._isActive) {
            this._listeners.push(cb)
            if (this._value !== null) {
                setTimeout(() => {
                    cb(this._value!)
                }, 0)
            }
        }

        return this
    }

    public onError(cb: ErrorCallback): this {
        if (this._isActive) {
            this._errorListeners.push(cb)
        }

        return this
    }

    private update(value: T): boolean {
        if (this._isActive && !Utils.deepEqual(value, this._value)) {
            this._previous = this._value
            this._value = value
            this._listeners.forEach((next: ValueCallback<T>) => {
                next(value)
            })
        }

        return this._isActive
    }

    private updateErrors(err: Error): boolean {
        if (this._isActive) {
            this._errorListeners.forEach((next: ErrorCallback) => {
                next(err)
            })
        }

        return this._isActive
    }
}
