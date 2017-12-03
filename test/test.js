const Metrics = require('../index');
const expect = require('chai').expect
const config={
    metrics:{
        collectDefault:true
    }
}

describe('Init metrics', () => {
    it('Should read config', () => {
        const metrics = new Metrics(config.metrics);
        expect(metrics._options.collectDefault).to.be.true 
    });
    it('Should add time measure', () => {
        const metrics = new Metrics(config.metrics);
        metrics.addTimeMeasure({
            name:'m1',
            labels:['l1','l2']
        })
    });
});