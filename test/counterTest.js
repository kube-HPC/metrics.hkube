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

describe('Counter Measure', () => {
    beforeEach(() => {
        client.register.clear();
    });
    it('Should throw if no name in option', async () => {
        await metrics.init();
        expect(() => metrics.addCounterMeasure({})).to.throw("data should have required property 'name'");
    });
    it('Should throw if no options', async () => {
        await metrics.init();
        expect(() => metrics.addCounterMeasure()).to.throw("data should have required property 'name'");
    });
    it('Should throw if same name added twice', async () => {
        await metrics.init();
        metrics.addCounterMeasure({ name: 'm1' });
        expect(() => metrics.addCounterMeasure({ name: 'm1' })).to.throw('the measure m1 is already registered');
    });
    it('Should add without labels', async () => {
        await metrics.init(config.metrics);
        expect(metrics._metrics.size).to.eq(0);
        metrics.addCounterMeasure({
            name: 'm1'
        });
        expect(metrics._metrics.size).to.eq(1);
        metrics.removeMeasure('m1');
        expect(metrics._metrics.size).to.eq(0);
    });

    it('Should add and remove time measure', async () => {
        await metrics.init(config.metrics);
        expect(metrics._metrics.size).to.eq(0);
        metrics.addCounterMeasure({
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
        metrics.addCounterMeasure({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        expect(metrics._metrics.size).to.eq(1);
        metrics.removeMeasure('m1');
        expect(metrics._metrics.size).to.eq(0);
        metrics.addCounterMeasure({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        expect(metrics._metrics.size).to.eq(1);
    });
    it('Should return measure', async () => {
        await metrics.init(config.metrics);
        const measure = metrics.addCounterMeasure({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        expect(measure).to.exist;
        expect(measure._requestCounter).to.exist;
    });
    it('should get measure by name', async () => {
        await metrics.init(config.metrics);
        const measure = metrics.addCounterMeasure({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        const getMeasure = metrics.get('m1');
        expect(getMeasure).to.eql(measure);
    });
    it('should get measure with prefix by name', async () => {
        await metrics.init(config.metrics);
        const measure = metrics.addCounterMeasure({
            prefix: 'hkube_',
            name: 'm1',
            labels: ['l1', 'l2']
        });
        const getMeasure = metrics.get('m1');
        expect(getMeasure).to.eql(measure);
    });
    it('Should increment measure without labels', async () => {
        await metrics.init(config.metrics);
        const measure = metrics.addCounterMeasure({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        measure.inc({});
        expect(client.register.metrics()).to.include('m1_counter 1');
        measure.inc();
        expect(client.register.metrics()).to.include('m1_counter 2');
    });
    it('Should increment measure with labels', async () => {
        await metrics.init(config.metrics);
        const measure = metrics.addCounterMeasure({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        measure.inc({ labelValues: { l1: 'l1Val' } });
        measure.inc({ labelValues: { l1: 'l1Val' } });
        expect(client.register.metrics()).to.include('m1_counter{l1="l1Val"} 2');
        measure.inc({ labelValues: { l1: 'l1Val2' } });
        expect(client.register.metrics()).to.include('m1_counter{l1="l1Val2"} 1');
    });
});
