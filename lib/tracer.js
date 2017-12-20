const initTracer = require('jaeger-client').initTracer;
const opentracing = require('opentracing');
const djsv = require('djsv');
const uuid = require('uuid/v4');
const { tracerSchema, startSpanSchema } = require('./schema');

class Tracer {
    constructor() {
        this._spans = new Map();
    }
    async init(options) {

        options = options || {};
        const tracerConfig = options.tracerConfig || {}
        const tracerOptions = options.tracerOptions || {}
        const validator = djsv(tracerSchema);
        const validatadOptions = validator(tracerConfig);
        if (validatadOptions.valid) {
            this._options = validatadOptions.instance;
        }
        else {
            throw new Error(validatadOptions.error);
        }
        this._tracer = initTracer(tracerConfig, tracerOptions);
    }

    startSpan(options) {
        options = options || {};
        const validator = djsv(startSpanSchema);
        const validatadOptions = validator(options);
        if (validatadOptions.valid) {
            options = validatadOptions.instance;
        }
        else {
            throw new Error(validatadOptions.error);
        }
        const id = options.id || uuid();
        const spanOptions = {};
        if (options.parent) {
            if (options.parent.childOf) {
                const parentSpan = this._tracer.extract(opentracing.FORMAT_TEXT_MAP,options.parent.childOf);
                spanOptions.childOf = parentSpan;
            }
            else {
                const parentSpan = this._tracer.extract(opentracing.FORMAT_TEXT_MAP,options.parent.relative);
                spanOptions.references = [opentracing.followsFrom(parentSpan)]
            }
        }

        
        const opentracingSpan = this._tracer.startSpan(options.name, spanOptions)
        const res = (span) => (
            {
                id,
                context: () => {
                    const contextDict = {};
                    this._tracer.inject(span,opentracing.FORMAT_TEXT_MAP,contextDict);
                    return  contextDict;
                },
                finish: () => {
                    span.finish();
                },
                addTag: (keyValue) => {
                    span.addTags(keyValue);
                }
            }
        )

        return res(opentracingSpan);
    }


}

module.exports = new Tracer();
