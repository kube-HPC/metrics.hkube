const metrics = require('../index');
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

describe('Gauge Measure', () => {
    beforeEach(() => {
        client.register.clear();
    });
    it('Should throw if no name in option', async () => {
        await metrics.init();
        expect(() => metrics.addGaugeMeasure({})).to.throw("data should have required property 'name'");
    });
    it('Should throw if no options', async () => {
        await metrics.init();
        expect(() => metrics.addGaugeMeasure()).to.throw("data should have required property 'name'");
    });
    it('Should throw if same name added twice', async () => {
        await metrics.init();
        metrics.addGaugeMeasure({ name: 'm1' });
        expect(() => metrics.addGaugeMeasure({ name: 'm1' })).to.throw('the measure m1 is already registered');
    });
    it('Should add without labels', async () => {
        await metrics.init(config.metrics);
        expect(metrics._metrics.size).to.eq(0);
        metrics.addGaugeMeasure({
            name: 'm1'
        });
        expect(metrics._metrics.size).to.eq(1);
        metrics.removeMeasure('m1');
        expect(metrics._metrics.size).to.eq(0);
    });

    it('Should add and remove time measure', async () => {
        await metrics.init(config.metrics);
        expect(metrics._metrics.size).to.eq(0);
        metrics.addGaugeMeasure({
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
        metrics.addGaugeMeasure({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        expect(metrics._metrics.size).to.eq(1);
        metrics.removeMeasure('m1');
        expect(metrics._metrics.size).to.eq(0);
        metrics.addGaugeMeasure({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        expect(metrics._metrics.size).to.eq(1);
    });
    it('Should return measure', async () => {
        await metrics.init(config.metrics);
        const measure = metrics.addGaugeMeasure({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        expect(measure).to.exist;
        expect(measure._requestGauge).to.exist;
    });
    it('should get measure by name', async () => {
        await metrics.init(config.metrics);
        const measure = metrics.addGaugeMeasure({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        const getMeasure = metrics.get('m1');
        expect(getMeasure).to.eql(measure);
    });
    it('Should increment measure without labels', async () => {
        await metrics.init(config.metrics);
        const measure = metrics.addGaugeMeasure({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        measure.inc({});
        expect(client.register.metrics()).to.include('m1_gauge 1');
        measure.inc();
        expect(client.register.metrics()).to.include('m1_gauge 2');
        measure.inc({ step: 5 });
        expect(client.register.metrics()).to.include('m1_gauge 7');
    });
    it('Should decrement measure without labels', async () => {
        await metrics.init(config.metrics);
        const measure = metrics.addGaugeMeasure({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        measure.inc({});
        measure.inc({});
        measure.inc({});
        expect(client.register.metrics()).to.include('m1_gauge 3');
        measure.dec();
        measure.dec({});
        expect(client.register.metrics()).to.include('m1_gauge 1');
        measure.dec({ step: 5 });
        expect(client.register.metrics()).to.include('m1_gauge -4');
    });
    it('Should increment measure with labels', async () => {
        await metrics.init(config.metrics);
        const measure = metrics.addGaugeMeasure({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        measure.inc({ labelValues: { l1: 'l1Val' } });
        measure.inc({ labelValues: { l1: 'l1Val' } });
        expect(client.register.metrics()).to.include('m1_gauge{l1="l1Val"} 2');
        measure.inc({ labelValues: { l1: 'l1Val2' } });
        expect(client.register.metrics()).to.include('m1_gauge{l1="l1Val2"} 1');
    });
    it('Should decrement measure with labels', async () => {
        await metrics.init(config.metrics);
        const measure = metrics.addGaugeMeasure({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        measure.inc({ labelValues: { l1: 'l1Val' } });
        measure.inc({ labelValues: { l1: 'l1Val' } });
        measure.dec({ labelValues: { l1: 'l1Val' } });
        expect(client.register.metrics()).to.include('m1_gauge{l1="l1Val"} 1');
        measure.inc({ labelValues: { l1: 'l1Val2' } });
        measure.inc({ labelValues: { l1: 'l1Val2' } });
        expect(client.register.metrics()).to.include('m1_gauge{l1="l1Val2"} 2');
        measure.dec({ labelValues: { l1: 'l1Val2' } });
        expect(client.register.metrics()).to.include('m1_gauge{l1="l1Val2"} 1');
    });

    it('Should set measure without labels', async () => {
        await metrics.init(config.metrics);
        const measure = metrics.addGaugeMeasure({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        measure.set({ value: 5 });
        expect(client.register.metrics()).to.include('m1_gauge 5');
        measure.set({ value: 3 });
        expect(client.register.metrics()).to.include('m1_gauge 3');
    });
    it('Should set measure with labels', async () => {
        await metrics.init(config.metrics);
        const measure = metrics.addGaugeMeasure({
            name: 'm1',
            labels: ['l1', 'l2']
        });
        measure.set({ value: 5, labelValues: { l1: 'l1Val' } });
        expect(client.register.metrics()).to.include('m1_gauge{l1="l1Val"} 5');
        measure.set({ value: 3, labelValues: { l1: 'l1Val2' } });
        expect(client.register.metrics()).to.include('m1_gauge{l1="l1Val2"} 3');
    });
});
