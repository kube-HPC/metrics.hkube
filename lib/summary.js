const client = require('prom-client');
const uuid = require('uuid/v4');
const SUMMARY_POSTFIX = '_summary';
class Summary {
    /**
     * 
     * @param {Object} options 
     * @param {string} options.name The name of the measure. Must be unique
     * @param {string} options.description The description of the measure. If not specified, the name is used
     * @param {string[]} [options.labels] array of label names
     * @param {number[]} [options.percentiles] array of percentiles if not defined, the defualt is used
     */
    constructor(options) {
        this._name = options.name;
        this._startedMeasures = new Map();
        this._summary = new client.Summary({
            name: options.name + SUMMARY_POSTFIX,
            help: options.description || options.name,
            labels: options.labels,
            // percentiles: options.percentiles,
        });
    }

    /**
     * Starts a new measure
     * @param {string} [id] The uuid of the. If not supplied, one is generated and returned
     * @param {Object} [labelValues] key value of label values
     */
    start({ id, labelValues } = {}) {
        const startTime = Date.now();
        const labels = Object.assign({}, labelValues);
        if (!id) {
            id = uuid();
        }
        this._startedMeasures.set(id, { startTime, labels });
        return id;
    }

    end({ id, labelValues }) {
        if (!id) {
            throw new Error('id must be specified');
        }
        const measure = this._startedMeasures.get(id);
        if (!measure) {
            throw new Error(`measure not found for id ${id}`);
        }
        this._startedMeasures.delete(id);
        let { labels } = measure;
        const { startTime } = measure;
        if (startTime == null) {
            throw new Error(`measure of ${id} has not been started`);
        }
        const diff = Date.now() - startTime;
        labels = Object.assign({}, labels, labelValues);
        this._startTime = null;
        this._summary.observe(labels, diff);
    }

    remove() {
        client.register.removeSingleMetric(this._name + SUMMARY_POSTFIX);
    }
}

module.exports = Summary;
