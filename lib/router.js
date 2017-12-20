const express = require('express');
const metricsRoute = (metrics) => {
    const router = express.Router();
    router.get('/', (req, res, next) => {
        res.send(metrics.metrics());
        next();
    });
    return router;
};

module.exports = metricsRoute;
