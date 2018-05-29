export type ValueCallback<T> = (value: T) => void
export type ValueSink<T> = (value: T) => boolean
export type UpdateFunction<T> = (sink: ValueSink<T>) => void

export class Observer<T> {
    private _isActive: boolean
    private _value: T | null
    private _previous: T | null
    private _listeners: Array<ValueCallback<T>> = []
    constructor(updater: UpdateFunction<T>, value?: T) {
        this._value = value || null
        this._previous = null
        this._isActive = true
        updater((newValue: T): boolean => {
            return this.update(newValue)
        })
    }

    public destroy(): void {
        this._isActive = false
        this._listeners = []
    }

    public previous(): T | null {
        return this._previous
    }

    public current(): T | null {
        return this._value
    }

    public onValue(cb: ValueCallback<T>): void {
        this._listeners.push(cb)
    }

    private update(value: T): boolean {
        if (this._isActive && value !== this._value) {
            this._previous = this._value
            this._value = value
            this._listeners.forEach((next: ValueCallback<T>) => {
                next(value)
            })
        }

        return this._isActive
    }
}
