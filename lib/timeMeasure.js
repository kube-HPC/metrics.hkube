const client = require('prom-client');
const uuid = require('uuid/v4')
const defaultBuckets = [0.10, 5, 15, 50, 100, 200, 300, 400, 500];
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
        this._startTime=null;
        this._histogram = new client.Histogram({
            name: options.name + '_histogram',
            help: options.description || options.name,
            labelNames: options.labels,
            buckets: options.buckets || defaultBuckets
        });
        this._requestCounter = new client.Counter({
            name: options.name + '_counter',
            help: options.description || options.name,
            labelNames: options.labels
        });
    }

    /**
     * Starts a new measure
     * @param {string} [id] The uuid of the 
     * @param {Object} [labelValues] key value of label values
     */
    start({id,labelValues}={}){
        this._startTime = Date.now();
        this._labelValues = Object.assign({},labelValues);
        if (!id){
            id=uuid();
        }
        return id;
    }

    end({id,labelValues}){
        const diff = Date.now() - this._startTime;
        this._labelValues = Object.assign({},this._labelValues,labelValues);
        this._startTime=null;
        this._histogram.observe(this._labelValues,diff);
        this._requestCounter.inc(this._labelValues);
    }
}

module.exports = TimeMeasure;