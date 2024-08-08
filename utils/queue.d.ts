export interface Queue<T> {
    push(promise: () => Promise<T>): Promise<T>;
    pop(): void;
}
export declare class PromiseQueue<T> implements Queue<T> {
    promises: {
        promise: () => Promise<T>;
        resolve: (value: T) => void;
        reject: (reason?: any) => void;
    }[];
    runningPromise: boolean;
    push(promise: () => Promise<T>): Promise<T>;
    pop(): void;
}
