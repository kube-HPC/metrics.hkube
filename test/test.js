const metrics = require('../index');
const expect = require('chai').expect
const client = require('prom-client');

const config={
    metrics:{
        collectDefault:true,
    }
}

describe('Init metrics', () => {
    beforeEach(() => {
        client.register.clear();
    });
    it('Should read config',async () => {
        // const metrics = new Metrics(config.metrics);
        await metrics.init(config.metrics)
        expect(metrics._options.collectDefault).to.be.true 
    });
    it('Should init without options',async () => {
        await metrics.init()
        expect(metrics._options.collectDefault).to.be.false 
        
    });
    it('Should throw if no name in option',async () => {
        await metrics.init()
        expect(()=>metrics.addTimeMeasure({})).to.throw(Error)
    });
    it('Should add and remove time measure',async () => {
        await metrics.init(config.metrics)
        expect(metrics._metrics.size).to.eq(0);
        metrics.addTimeMeasure({
            name:'m1',
            labels:['l1','l2']
        })
        expect(metrics._metrics.size).to.eq(1);
        metrics.removeMeasure('m1');
        expect(metrics._metrics.size).to.eq(0);
    });
    it('Should return measure',async () => {
        await metrics.init(config.metrics)
        const measure = metrics.addTimeMeasure({
            name:'m1',
            labels:['l1','l2']
        })
        expect(measure).to.exist;
        expect(measure._histogram).to.exist;
        expect(measure._requestCounter).to.exist;
        expect(measure._startedMeasures).to.be.empty;
    });
    it('should get measure by name',async () => {
        await metrics.init(config.metrics)
        const measure = metrics.addTimeMeasure({
            name:'m1',
            labels:['l1','l2']
        })
        const getMeasure = metrics.get('m1');
        expect(getMeasure).to.eql(measure);         
    });
    it('should throw if no name for get measure by name',async () => {
        await metrics.init(config.metrics);
        expect(()=>metrics.get()).to.throw(Error)
    });
    it('should return null if name does not exist',async () => {
        await metrics.init(config.metrics);
        const getMeasure = metrics.get('m1');
        expect(getMeasure).to.not.exist;        
    });
    it('Should start measure without id', async() => {
        await metrics.init(config.metrics);
        const measure = metrics.addTimeMeasure({
            name:'m1',
            labels:['l1','l2']
        })
        const id = measure.start();
        expect(measure._startedMeasures).to.include.keys(id);
        expect(id).to.exist;
        measure.end({id});
        expect(measure._startedMeasures).to.not.include.keys(id);;
        
    });

    it('Should copy labels', async() => {
        await metrics.init(config.metrics);
        const measure = metrics.addTimeMeasure({
            name:'m1',
            labels:['l1','l2']
        })
        const id = measure.start({labelValues:{
            l1:1
        }});
        expect(measure._startedMeasures.get(id).labels).to.include({l1:1})
        measure.end({id,labelValues:{l2:2}});
        // expect(measure._startedMeasures.get(id).labels).to.include({l2:2,l1:1})
        expect(client.register.metrics()).to.include('m1_counter{l1="1",l2="2"} 1');
        expect(client.register.metrics()).to.include('m1_histogram_count{l1="1",l2="2"} 1');
    });

    it('Should override labels',async () => {
        await metrics.init(config.metrics);
        const measure = metrics.addTimeMeasure({
            name:'m1',
            labels:['l1','l2']
        })
        const id = measure.start({labelValues:{
            l1:1,
            l2:2
        }});
        expect(measure._startedMeasures.get(id).labels).to.include({l1:1})
        measure.end({id,labelValues:{l2:3}});
        // expect(measure._labelValues).to.include({l2:3,l1:1})
        expect(client.register.metrics()).to.include('m1_counter{l1="1",l2="3"} 1');
        
    });
    it('Should work without labels',async () => {
        await metrics.init(config.metrics);
        const measure = metrics.addTimeMeasure({
            name:'m1',
            labels:['l1','l2']
        })
        const id = measure.start();
        expect(measure._startedMeasures.get(id).labels).to.be.empty
        measure.end({id});
        expect(measure._startedMeasures).to.be.empty
        expect(client.register.metrics()).to.include('m1_counter 1');
        expect(client.register.metrics()).to.include('m1_histogram_count 1');
    });

    
});