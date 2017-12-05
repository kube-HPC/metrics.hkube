const initSchema = {
    name: "initSchema",
    type: "object",
    properties: {
        collectDefault: {
            type: "boolean",
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
            default:{}
        }
    }
}

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
            default:[]
        },
        buckets: {
            type: 'array',
            items: {
                type: 'number'
            },
            default:[0.10, 5, 15, 50, 100, 200, 300, 400, 500]
        }
    },
    required: ['name']
}

module.exports = {
    initSchema,
    addTimeMeasureSchema
}