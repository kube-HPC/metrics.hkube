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

const resetMeasureForMiddleware = (metrics) => {
    measureForMiddleware = null;
    metrics.removeMeasure(MEASURE_NAME);
};

const beforeRoutesMiddlewares = filter => (req, res, next) => {
    if (filter.includes(req.url)) {
        return next();
    }
    res.locals.measureId = measureForMiddleware.start({});
    return next();
};

const afterRoutesMiddlewares = filter => (req, res, next) => {
    if (filter.includes(req.url)) {
        return next();
    }
    measureForMiddleware.end({
        id: res.locals.measureId,
        labelValues: {
            method: req.method,
            route: req.originalUrl,
            code: res.statusCode,
        }
    });
    return next();
};


module.exports = {
    createMeasureForMiddleware,
    beforeRoutesMiddlewares,
    afterRoutesMiddlewares,
    resetMeasureForMiddleware
};
