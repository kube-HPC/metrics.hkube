const optional = require('optional');
const express = optional('express');
const metricsRoute = (metrics) => {
    if (!express) {
        return {};
    }
    const router = express.Router();
    router.get('/', (req, res, next) => {
        res.send(metrics.metrics());
        next();
    });
    return router;
};

module.exports = metricsRoute;
