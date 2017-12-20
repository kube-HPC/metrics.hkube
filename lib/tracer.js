const initTracer = require('jaeger-client').initTracer;
const opentracing = require('opentracing');
const djsv = require('djsv');
const uuid = require('uuid/v4');
const { tracerSchema, startSpanSchema, parentRelationships } = require('./schema');

class Tracer {
    constructor() {
        this._spanStack = [];

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
        let parentContext;
        if (options.parent) {
            parentContext = this._tracer.extract(opentracing.FORMAT_TEXT_MAP, options.parent);
        }
        else if (this._spanStack.length > 0) {
            parentContext = this._tracer.extract(opentracing.FORMAT_TEXT_MAP, this.topSpan.context());
        }

        if (parentContext) {
            switch (options.parentRelationship) {
                case parentRelationships.childOf:
                    spanOptions.childOf = parentContext;
                    break;
                case parentRelationships.follows:
                    spanOptions.references = [opentracing.followsFrom(parentContext)]
                    break;
            }

        }

        const opentracingSpan = this._tracer.startSpan(options.name, spanOptions)
        const res = (span) => (
            {
                id,
                context: () => {
                    const contextDict = {};
                    this._tracer.inject(span, opentracing.FORMAT_TEXT_MAP, contextDict);
                    return contextDict;
                },
                finish: () => {
                    this.pop();
                    span.finish();
                },
                addTag: (keyValue) => {
                    span.addTags(keyValue);
                }
            }
        )
        const span = res(opentracingSpan);
        this._spanStack.push(span);
        return span;
    }

    get topSpan() {
        if (this._spanStack.length == 0) {
            return null;
        }
        return this._spanStack[0];
    }

    pop() {
        if (this._spanStack.length == 0) {
            return null;
        }
        return this._spanStack.pop();
    }

    get parentRelationships() {
        return parentRelationships;
    }

}

module.exports = new Tracer();
