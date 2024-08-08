"use strict";
// Based on https://medium.com/@karenmarkosyan/how-to-manage-promises-into-dynamic-queue-with-vanilla-javascript-9d0d1f8d4df5
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromiseQueue = void 0;
class PromiseQueue {
    constructor() {
        this.promises = [];
        this.runningPromise = false;
    }
    push(promise) {
        return new Promise((resolve, reject) => {
            this.promises.push({
                promise,
                resolve,
                reject,
            });
            this.pop();
        });
    }
    pop() {
        if (this.runningPromise || !this.promises.length) {
            return;
        }
        const { promise, resolve, reject } = this.promises.shift();
        this.runningPromise = true;
        promise()
            .then((res) => {
            this.runningPromise = false;
            resolve(res);
            this.pop();
        })
            .catch((err) => {
            this.runningPromise = false;
            reject(err);
            this.pop();
        });
    }
}
exports.PromiseQueue = PromiseQueue;
//# sourceMappingURL=queue.js.map