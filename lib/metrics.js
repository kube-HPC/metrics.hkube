const { initSchema } = require('./schema');
const client = require('prom-client');
const validator = require('./validator');
const TimeMeasure = require('./timeMeasure');
const Summary = require('./summary');
const CounterMeasure = require('./counter');
const GaugeMeasure = require('./gauge');
const { addTimeMeasureSchema, addCounterMeasureSchema, addTimeMeasureSummarySchema } = require('./schema');
const router = require('./router');
const RestServer = require('@hkube/rest-server');
const promUtils = require('prom-client/lib/util.js');

const {
    beforeRoutesMiddlewares,
    afterRoutesMiddlewares,
    createMeasureForMiddleware,
    resetMeasureForMiddleware
} = require('./middleware');


class Metrics {
    constructor() {
        this._metrics = new Map();
        this._server = null;
    }

    async init(options) {
        this._prefix = (options && options.prefix) || '';
        client.register.clear();
        this._metrics.clear();
        resetMeasureForMiddleware(this);
        this._options = options || {};
        validator.validate(initSchema, this._options);

        if (this._options.collectDefault) {
            const { collectDefaultMetrics } = client;
            collectDefaultMetrics({ timeout: 5000 });
        }
        if (this._options.server.port) {
            this._server = new RestServer();
            await this._server.start({
                port: this._options.server.port,
                routes: [this.getRouter()]
            });
        }
    }

    getRouter() {
        return { route: this._options.server.path, router: router(this) };
    }

    getMiddleware() {
        createMeasureForMiddleware(this);
        return {
            beforeRoutesMiddlewares: [beforeRoutesMiddlewares([this._options.server.path])],
            afterRoutesMiddlewares: [afterRoutesMiddlewares([this._options.server.path])]
        };
    }

    metrics() {
        return client.register.metrics();
    }

    get prefix() {
        return this._prefix;
    }

    /**
     * 
     * @param {Object} options 
     * @param {string} options.name The name of the measure. Must be unique
     * @param {string} options.prefix measure name prefix (default: '')
     * @param {string[]} [options.labels] array of label names
     * @throws {Error} Will throw if schema is invalid, or name already exists
     */
    addTimeMeasure(options) {
        options = options || {};
        validator.validate(addTimeMeasureSchema, options);
        options.name = this.prefix + options.name;
        if (this._metrics.has(options.name)) {
            throw new Error(`the measure ${options.name} is already registered`);
        }
        const measure = new TimeMeasure(options);
        this._metrics.set(options.name, measure);
        return measure;
    }

    /**
    * 
    * @param {Object} options 
    * @param {string} options.name The name of the measure. Must be unique
    * @param {string} options.prefix measure name prefix (default: '')
    * @param {string[]} [options.labels] array of label names
    * @param {number[]} [options.percentiles] array of percentiles if not defined, the defualt is used
    * @throws {Error} Will throw if schema is invalid, or name already exists
    */
    addSummary(options) {
        options = options || {};
        validator.validate(addTimeMeasureSummarySchema, options);
        options.name = this.prefix + options.name;
        if (this._metrics.has(options.name)) {
            throw new Error(`the summary ${options.name} is already registered`);
        }
        const summary = new Summary(options);
        this._metrics.set(options.name, summary);
        return summary;
    }
    /**
     * 
     * @param {Object} options 
     * @param {string} options.name The name of the measure. Must be unique
     * @param {string} options.prefix measure name prefix (default: '')
     * @param {string[]} [options.labels] array of label names
     * @throws {Error} Will throw if schema is invalid, or name already exists
     */
    addCounterMeasure(options) {
        options = options || {};
        validator.validate(addCounterMeasureSchema, options);
        options.name = this.prefix + options.name;
        if (this._metrics.has(options.name)) {
            throw new Error(`the measure ${options.name} is already registered`);
        }
        const measure = new CounterMeasure(options);
        this._metrics.set(options.name, measure);
        return measure;
    }

    /**
     * 
     * @param {Object} options 
     * @param {string} options.name The name of the measure. Must be unique
     * @param {string} options.prefix measure name prefix (default: '')
     * @param {string[]} [options.labels] array of label names
     * @throws {Error} Will throw if schema is invalid, or name already exists
     */
    addGaugeMeasure(options) {
        options = options || {};
        validator.validate(addCounterMeasureSchema, options);
        options.name = this.prefix + options.name;
        if (this._metrics.has(options.name)) {
            throw new Error(`the measure ${options.name} is already registered`);
        }
        const measure = new GaugeMeasure(options);
        this._metrics.set(options.name, measure);
        return measure;
    }

    /**
     * get metric by name
     * @param name metric name, without prefix
     * @returns metric object
     */
    get(name) {
        if (!name) {
            throw new Error('name must be defined');
        }
        return this._metrics.get(this.prefix + name);
    }

    /**
     * remove metric by name
     * @param name metric name, without prefix
     */
    removeMeasure(name) {
        const measure = this.get(name);
        if (measure) {
            measure.remove();
            this._metrics.delete(this.prefix + name);
        }
    }

    /**
     * remove all entries in the specified metrics, that are assosiated with the specified jobId
     * @param {*} options
     * @param {string} options.jobId jobId
     * @param {string[]} [options.metricsToRemove] array of metric names to remove
     */
    removeMeasureEntries(options) {
        const { labelName, labelValue, metricsToRemove } = options;
        metricsToRemove.forEach((metricName) => {
            const measureInstance = this.get(metricName);
            if (measureInstance) {
                measureInstance.removeEntriesByLabel(labelName, labelValue);
            }
        });
    }   
}

module.exports = new Metrics();
