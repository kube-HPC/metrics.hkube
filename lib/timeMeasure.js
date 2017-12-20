const client = require('prom-client');
const uuid = require('uuid/v4');
class TimeMeasure {
    /**
     * 
     * @param {Object} options 
     * @param {string} options.name The name of the measure. Must be unique
     * @param {string} options.description The description of the measure. If not specified, the name is used
     * @param {string[]} [options.labels] array of label names
     * @param {number[]} [options.buckets] array of historgram buckets. in not defined, the defualt is used
     */
    constructor(options) {
        this._startedMeasures = new Map();
        this._histogram = new client.Histogram({
            name: options.name + '_histogram',
            help: options.description || options.name,
            labelNames: options.labels,
            buckets: options.buckets
        });
        this._requestCounter = new client.Counter({
            name: options.name + '_counter',
            help: options.description || options.name,
            labelNames: options.labels 
        });
    }

    /**
     * Starts a new measure
     * @param {string} [id] The uuid of the. If not supplied, one is generated and returned
     * @param {Object} [labelValues] key value of label values
     */
    start({id, labelValues} = {}) {
        const startTime = Date.now();
        const labels = Object.assign({}, labelValues);
        if (!id) {
            id = uuid();
        }
        this._startedMeasures.set(id, {startTime, labels});
        return id;
    }

    end({id, labelValues}) {
        if (!id) {
            throw new Error('id must be specified');
        }
        const measure = this._startedMeasures.get(id);
        if (!measure) {
            throw new Error(`measure not found for id ${id}`);
        }
        this._startedMeasures.delete(id);
        let {labels} = measure;
        const {startTime} = measure;
        if (startTime == null) {
            throw new Error(`measure of ${id} has not been started`);
        }
        const diff = Date.now() - startTime;
        labels = Object.assign({}, labels, labelValues);
        this._startTime = null;
        this._histogram.observe(labels, diff);
        this._requestCounter.inc(labels);
    }
}

module.exports = TimeMeasure;
