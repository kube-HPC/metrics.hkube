const djsv = require('djsv');
const initSchema = require('./schema').initSchema
const client = require('prom-client');
const TimeMeasure = require('./timeMeasure');
const addTimeMeasureSchema = require('./schema').addTimeMeasureSchema
const router = require('./router');
const RestServer = require('@hkube/rest-server')
class Metrics {
    constructor() {
        this._metrics = new Map();
        this._server = null;
    }

    async init(options){
        client.register.clear();
        this._metrics.clear();
        options = options || {};
        const validator = djsv(initSchema);
        const validatadOptions = validator(options);
        if (validatadOptions.valid) {
            this._options = validatadOptions.instance;
        }
        else {
            throw new Error(validatadOptions.error);
        }

        if (this._options.collectDefault) {
            const collectDefaultMetrics = client.collectDefaultMetrics;
            collectDefaultMetrics({ timeout: 5000 });
        }
        if (this._options.server.port){
            this._server=new RestServer();
            await this._server.start({
                port:this._options.server.port,
                routes:[this.getRouter()]
            })
        }
    }
    getRouter(){
        return { route: this._options.server.path, router: router(this) };
    }
    metrics(){
        return client.register.metrics();
    }


    /**
     * 
     * @param {Object} options 
     * @param {string} options.name The name of the measure. Must be unique
     * @param {string[]} [options.labels] array of label names
     * @throws {Error} Will throw if schema is invalid, or name already exists
     */
    addTimeMeasure(options) {
        options = options || {};
        const validator = djsv(addTimeMeasureSchema);
        const validatadOptions = validator(options);
        if (validatadOptions.valid) {
            options = validatadOptions.instance;
        }
        else {
            throw new Error(validatadOptions.error);
        }
        if (this._metrics.has(options.name)) {
            throw new Error(`the measure ${options.name} is already registered`);
        }
        const measure = new TimeMeasure(options);
        this._metrics.set(options.name, measure);
        return measure;
    }
    get(name) {
        if (!name) {
            throw new Error('name must be defined');
        }
        return this._metrics.get(name);
    }
    removeMeasure(name) {
        const metric = this._metrics.delete(name);
       
    }
}

module.exports = new Metrics()