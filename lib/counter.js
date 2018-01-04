const client = require('prom-client');
class CounterMeasure {
    /**
     * 
     * @param {Object} options 
     * @param {string} options.name The name of the measure. Must be unique
     * @param {string} options.description The description of the measure. If not specified, the name is used
     * @param {string[]} [options.labels] array of label names
     */
    constructor(options) {
        this._requestCounter = new client.Counter({
            name: options.name + '_counter',
            help: options.description || options.name,
            labelNames: options.labels
        });
    }

    inc({ labelValues } = {}) {
        this._requestCounter.inc(labelValues);
    }
}

module.exports = CounterMeasure;
