const initSchema = {
    "name": "initSchema",
    "type": "object",
    "properties": {
        "collectDefault": {
            "type": "boolean",
            "default": false
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
        labels: {
            type: 'array',
            items: {
                type: 'string'
            },
        }
    },
    required: ['name']
}

module.exports = {
    initSchema,
    addTimeMeasureSchema
}