const initSchema = {
    name: 'initSchema',
    type: 'object',
    properties: {
        collectDefault: {
            type: 'boolean',
            default: false
        },
        server: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    default: '/metrics'
                },
                port: {
                    type: ['string', 'number']
                }
            },
            default: {}
        }
    }
};
const addCounterMeasureSchema = {
    name: 'addCounterMeasureSchema',
    type: 'object',
    properties: {
        name: {
            type: 'string'
        },
        description: {
            type: 'string'
        },
        labels: {
            type: 'array',
            items: {
                type: 'string'
            },
            default: []
        }
    },
    required: ['name']
};
const addTimeMeasureSchema = {
    name: 'addTimeMeasureSchema',
    type: 'object',
    properties: {
        name: {
            type: 'string'
        },
        description: {
            type: 'string'
        },
        labels: {
            type: 'array',
            items: {
                type: 'string'
            },
            default: []
        },
        buckets: {
            type: 'array',
            items: {
                type: 'number'
            },
            default: [0.10, 5, 15, 50, 100, 200, 300, 400, 500]
        }
    },
    required: ['name']
};

const addTimeMeasureSummarySchema = {
    name: 'addTimeMeasureSummarySchema',
    type: 'object',
    properties: {
        name: {
            type: 'string'
        },
        description: {
            type: 'string'
        },
        labels: {
            type: 'array',
            items: {
                type: 'string'
            },
            default: []
        },
        percentiles: {
            type: 'array',
            items: {
                type: 'number'
            },
            default: [0.01, 0.05, 0.5, 0.9, 0.95, 0.99, 0.999]
        }
    },
    required: ['name']
};

const tracerSchema = {
    type: 'object',
    properties: {
        serviceName: { type: 'string' },
        disable: { type: 'boolean' },
        sampler: {
            properties: {
                type: { type: 'string', default: 'const' },
                param: { type: 'number', default: 1 },
                host: { type: 'string' },
                port: { type: 'number' },
                refreshIntervalMs: { type: 'number' }
            },
            default: {},
            additionalProperties: false
        },
        reporter: {
            properties: {
                logSpans: { type: 'boolean' },
                agentHost: { type: 'string', default: 'localhost' },
                agentPort: { type: ['number', 'string'], default: 6832 },
                flushIntervalMs: { type: 'number' }
            },
            default: {},
            additionalProperties: false
        }
    },
    required: ['serviceName']
};

const parentRelationships = {
    childOf: 'childOf',
    follows: 'follows'
};

const startSpanSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        parentRelationship: {
            type: 'string',
            enum: Object.values(parentRelationships),
            default: parentRelationships.childOf
        },
        parent: { type: 'object' },
        tags: { type: 'object' }
    },
    additionalProperties: false,
    required: ['name']
};
module.exports = {
    initSchema,
    addTimeMeasureSchema,
    addCounterMeasureSchema,
    tracerSchema,
    startSpanSchema,
    parentRelationships
};
