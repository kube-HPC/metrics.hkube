const client = require('prom-client');
const COUNTER_POSTFIX = '_counter';
class CounterMeasure {
    /**
     * 
     * @param {Object} options 
     * @param {string} options.name The name of the measure. Must be unique
     * @param {string} options.description The description of the measure. If not specified, the name is used
     * @param {string[]} [options.labels] array of label names
     */
    constructor(options) {
        this._name = options.name;
        this._requestCounter = new client.Counter({
            name: options.name + COUNTER_POSTFIX,
            help: options.description || options.name,
            labelNames: options.labels
        });
        this._requestCounter.reset(); // start from 0 so rate() would work from beginning
    }

    inc({ labelValues } = {}) {
        this._requestCounter.inc(labelValues);
    }
    remove() {
        client.register.removeSingleMetric(this._name + COUNTER_POSTFIX);
    }
    removeEntries(jobId) {
        const keysToDelete = [];
        const hashKeys = Object.keys(this._requestCounter.hashMap);
        hashKeys.forEach((key) => {
            if (this._requestCounter.hashMap[key].labels.jobId === jobId) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => delete this._requestCounter.hashMap[key]);
    }
}

module.exports = CounterMeasure;
