export type ValueCallback<T> = (value: T) => void

export class Observable<T> {
    private _value: T | null
    private _previous: T | null
    private _listeners: Array<ValueCallback<T>> = []
    constructor(value?: T) {
        this._value = value || null
        this._previous = null
    }

    public update(value: T): void {
        if (value !== this._value) {
            this._previous = this._value
            this._value = value
            this._listeners.forEach((next: ValueCallback<T>) => {
                next(value)
            })
        }
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
}
