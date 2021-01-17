const Ajv = require('ajv');
const validator = new Ajv({ useDefaults: true });

class Validator {
    validate(schema, options) {
        const valid = validator.validate(schema, options);

        if (!valid) {
            const { errors } = validator;
            const error = validator.errorsText(errors);
            throw new Error(error);
        }
    }
}

module.exports = new Validator();
