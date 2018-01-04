const client = require('prom-client');
class GaugeMeasure {
    /**
     * 
     * @param {Object} options 
     * @param {string} options.name The name of the measure. Must be unique
     * @param {string} options.description The description of the measure. If not specified, the name is used
     * @param {string[]} [options.labels] array of label names
     */
    constructor(options) {
        this._requestGauge = new client.Gauge({
            name: options.name + '_gauge',
            help: options.description || options.name,
            labelNames: options.labels
        });
    }

    inc({ step, labelValues = {} } = {}) {
        this._requestGauge.inc(labelValues, step);
    }
    dec({ step, labelValues = {} } = {}) {
        this._requestGauge.dec(labelValues, step);
    }
    /**
     * 
     * @param {*} options
     * @param {Number} options.value the value to set. Must be specified
     * @param {Object} options.labelValues optional labels key/values
     */
    set({ value, labelValues = {} }) {
        this._requestGauge.set(labelValues, value);
    }
}

module.exports = GaugeMeasure;
