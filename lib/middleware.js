const MEASURE_NAME = 'API_REQUEST_MEASURE';
let measureForMiddleware;
const createMeasureForMiddleware = (metrics) => {
    if (measureForMiddleware) {
        return measureForMiddleware;
    }
    measureForMiddleware = metrics.addTimeMeasure({
        name: MEASURE_NAME,
        labels: ['method', 'route', 'code']
    });
    return measureForMiddleware;
};
const beforeRoutesMiddlewares = () => {
    return (req, res, next) => {
        res.locals.measureId = measureForMiddleware.start({});
        next();
    };
};
const afterRoutesMiddlewares = () => {
    return (req, res, next) => {
        measureForMiddleware.end({
            id: res.locals.measureId,
            labelValues: {
                method: req.method,
                route: req.originalUrl,
                code: res.statusCode,
            }
        });
        next();
    };
};

module.exports = {
    createMeasureForMiddleware,
    beforeRoutesMiddlewares,
    afterRoutesMiddlewares
};
