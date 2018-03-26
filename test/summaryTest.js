const { metrics } = require('../index');
const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const client = require('prom-client');

const config = {
    metrics: {
        collectDefault: true,
    }
};

describe('Summary Measure', () => {
    beforeEach(() => {
        client.register.clear();
    });
    it('Should throw if no name in option', async () => {
        await metrics.init();
        expect(() => metrics.addSummary({})).to.throw("data should have required property 'name'");
    });
    it('Should throw if no options', async () => {
        await metrics.init();
        expect(() => metrics.addSummary()).to.throw("data should have required property 'name'");
    });
    it('Should throw if same name added twice', async () => {
        await metrics.init();
        metrics.addSummary({ name: 'm1' });
        expect(() => metrics.addSummary({ name: 'm1' })).to.throw('the summary m1 is already registered');
    });
    it('Should add without labels', async () => {
        await metrics.init(config.metrics);
        expect(metrics._metrics.size).to.eq(0);
        metrics.addSummary({
            name: 'm1'
        });
        expect(metrics._metrics.size).to.eq(1);
        metrics.removeMeasure('m1');
        expect(metrics._metrics.size).to.eq(0);
    });

    it('Should add and remove time measure', async () => {
        await metrics.init(config.metrics);
        expect(metrics._metrics.size).to.eq(0);
        metrics.addSummary({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        expect(metrics._metrics.size).to.eq(1);
        metrics.removeMeasure('m1');
        expect(metrics._metrics.size).to.eq(0);
    });
    it('Should add and remove and add time measure', async () => {
        await metrics.init(config.metrics);
        expect(metrics._metrics.size).to.eq(0);
        metrics.addSummary({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        expect(metrics._metrics.size).to.eq(1);
        metrics.removeMeasure('m1');
        expect(metrics._metrics.size).to.eq(0);
        metrics.addSummary({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        expect(metrics._metrics.size).to.eq(1);
    });
    it('Should return measure', async () => {
        await metrics.init(config.metrics);
        const measure = metrics.addSummary({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        expect(measure).to.exist;
        const id = measure.start({
            id: '123123123',
            labelValues: {
                pipelineName: 'pipelineName',
                algorithmName: 'algorithmName'
            }
        });
        expect(measure._startedMeasures.has('123123123')).to.be.true;
        const mm = metrics.get('m1')
        const m = mm.end({
            id: '123123123',
            labelValues: {
                pipelineName: 'pipelineName',
                algorithmName: 'algorithmName'
            }
        });
        expect(measure._startedMeasures.has('123123123')).to.be.false;
    });
});
