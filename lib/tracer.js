const { initTracer } = require('jaeger-client');
const opentracing = require('opentracing');
const validator = require('./validator');
const uuid = require('uuid/v4');
const { tracerSchema, startSpanSchema, parentRelationships } = require('./schema');

class Tracer {
    constructor() {
        this._spanStacks = new Map();
    }
    async init(options) {
        options = options || {};
        const tracerConfig = options.tracerConfig || {};
        const tracerOptions = options.tracerOptions || {};
        validator.validate(tracerSchema, tracerConfig);
        this._tracer = initTracer(tracerConfig, tracerOptions);
    }

    startSpan(options) {
        options = options || {};
        validator.validate(startSpanSchema, options);
        const id = options.id || uuid();
        const spanOptions = {};
        let parentContext;
        if (options.parent) {
            parentContext = this._tracer.extract(opentracing.FORMAT_TEXT_MAP, options.parent);
        }
        else if (this._getSpanStack(id).length > 0) {
            parentContext = this._tracer.extract(opentracing.FORMAT_TEXT_MAP, this.topSpan(id).context());
        }

        if (parentContext) {
            switch (options.parentRelationship) { // eslint-disable-line default-case
                case parentRelationships.childOf:
                    spanOptions.childOf = parentContext;
                    break;
                case parentRelationships.follows:
                    spanOptions.references = [opentracing.followsFrom(parentContext)];
                    break;
            }
        }

        const opentracingSpan = this._tracer.startSpan(options.name, spanOptions);
        const res = span => (
            {
                name: options.name,
                id,
                context: () => {
                    const contextDict = {};
                    this._tracer.inject(span, opentracing.FORMAT_TEXT_MAP, contextDict);
                    return contextDict;
                },
                finish: (error) => {
                    if (error) {
                        span.setTag(opentracing.Tags.ERROR, true);
                        const errorMessage = error.message || error;
                        span.setTag('errorMessage', errorMessage);
                        span.log({ error });
                    }
                    this.pop(id);
                    span.finish();
                },
                addTag: (keyValue) => {
                    span.addTags(keyValue);
                },
            }
        );
        const span = res(opentracingSpan);
        if (options.tags) {
            span.addTag(options.tags);
        }
        let spanStack = this._spanStacks.get(id);
        if (!spanStack) {
            spanStack = [];
            this._spanStacks.set(id, spanStack);
        }
        spanStack.push(span);
        return span;
    }

    _getSpanStack(id) {
        if (!id) {
            return null;
        }
        const spanStack = this._spanStacks.get(id);
        if (!spanStack) {
            return [];
        }
        return spanStack;
    }

    topSpan(id) {
        if (!id) {
            return null;
        }
        const spanStack = this._spanStacks.get(id);
        if (!spanStack) {
            return null;
        }
        if (spanStack.length === 0) {
            return null;
        }
        return spanStack[spanStack.length - 1];
    }

    pop(id) {
        if (!id) {
            return null;
        }
        const spanStack = this._spanStacks.get(id);
        if (!spanStack) {
            return null;
        }
        if (spanStack.length === 0) {
            return null;
        }
        const span = spanStack.pop();
        if (spanStack.length === 0) {
            this._spanStacks.delete(id);
        }
        return span;
    }

    get parentRelationships() {
        return parentRelationships;
    }
}

/**
 * Create and init another tracer
 * @param name tracer name (replaces/creates serviceName in the options)
 * @param options rest options, may be equivalent to service tracer options
 * @returns Tracer
 */
async function createTracer(name, options) {
    // override serviceName anyway
    if (options) {
        if (options.tracerConfig) {
            options.tracerConfig.serviceName = name;
        }
        else {
            options.tracerConfig = { serviceName: name };
        }
    }
    else {
        options = { tracerConfig: { serviceName: name } };
    }

    const anotherTracer = new Tracer();
    await anotherTracer.init(options);
    return anotherTracer;
}


module.exports = new Tracer();
module.exports.createTracer = createTracer;
