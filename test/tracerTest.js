const { tracer } = require('../index');
const { InMemoryReporter, ConstSampler, RemoteReporter } = require('jaeger-client');
const opentracing = require('opentracing');
const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

describe('Tracer', () => {
    beforeEach((done) => {
        tracer._spanStacks.clear();
        if (tracer._tracer) {
            tracer._tracer.close(() => {
                tracer._tracer = null;
                done();
            });
        }
        else {
            done();
        }
    });
    describe('Init', () => {
        it('should throw without options', async () => {
            return expect(tracer.init()).to.be.rejectedWith("data should have required property 'serviceName'");
        });

        it('should init', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test'
                }
            });
            expect(tracer._tracer).to.exist;
            expect(tracer._tracer._reporter).to.be.an.instanceof(RemoteReporter);
        });

        it('should init with reporter', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test',
                },
                tracerOptions: {
                    reporter: new InMemoryReporter()
                }

            });
            expect(tracer._tracer).to.exist;
            expect(tracer._tracer._sampler).to.be.an.instanceof(ConstSampler);
            expect(tracer._tracer._reporter).to.be.an.instanceof(InMemoryReporter);
        });
    });
    describe('Span', () => {
        it('should throw without options', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test',
                },
                tracerOptions: {
                    reporter: new InMemoryReporter()
                }

            });
            expect(() => tracer.startSpan()).to.throw("data should have required property 'name'");
        });
        it('should throw empty options', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test',
                },
                tracerOptions: {
                    reporter: new InMemoryReporter()
                }

            });
            expect(() => tracer.startSpan({})).to.throw("data should have required property 'name'");
        });

        it('should return null span stack without id', () => {
            expect(tracer._getSpanStack()).to.be.null;
            expect(tracer.topSpan()).to.be.null;
            expect(tracer.pop()).to.be.null;
        });

        it('should return null span stack with id without spans', () => {
            tracer._spanStacks.set('id1', []);
            expect(tracer._getSpanStack('id1')).to.be.empty;
            expect(tracer.topSpan('id1')).to.be.null;
            expect(tracer.pop('id1')).to.be.null;
        });
        it('should generate unique id', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test',
                },
                tracerOptions: {
                    reporter: new InMemoryReporter()
                }

            });
            const span = tracer.startSpan({ name: 'test1' });
            const span2 = tracer.startSpan({ name: 'test1' });
            expect(span2.id).to.not.eql(span.id);
        });

        it('should have required properties', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test',
                },
                tracerOptions: {
                    reporter: new InMemoryReporter()
                }

            });
            const span = tracer.startSpan({ name: 'test1' });
            expect(span.id).to.exist;
            expect(span.finish).to.exist;
            expect(span.addTag).to.exist;
        });

        it('should finish span', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test',
                },
                tracerOptions: {
                    reporter: new InMemoryReporter()
                }

            });
            const span = tracer.startSpan({ name: 'test1' });
            expect(tracer._spanStacks.get(span.id)).to.have.lengthOf(1);
            expect(tracer._tracer._reporter.spans).to.be.empty;
            span.finish();
            expect(tracer._getSpanStack(span.id)).to.be.empty;
            expect(tracer._tracer._reporter.spans).to.have.lengthOf(1);
        });
        it('should finish span with error', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test',
                },
                tracerOptions: {
                    reporter: new InMemoryReporter()
                }

            });
            const span = tracer.startSpan({ name: 'test1' });
            expect(tracer._spanStacks.get(span.id)).to.have.lengthOf(1);
            expect(tracer._tracer._reporter.spans).to.be.empty;
            span.finish(new Error('Oh no!!!'));
            expect(tracer._getSpanStack(span.id)).to.be.empty;
            expect(tracer._tracer._reporter.spans).to.have.lengthOf(1);
            expect(tracer._tracer._reporter.spans[0]._tags).to.deep.include({ key: opentracing.Error, value: true });
            expect(tracer._tracer._reporter.spans[0]._tags).to.deep.include({ key: 'errorMessage', value: 'Oh no!!!' });
        });
        it('should add tags', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test',
                },
                tracerOptions: {
                    reporter: new InMemoryReporter()
                }

            });
            const span = tracer.startSpan({ name: 'test1' });
            const tag = { tagKey: 'tagValue' };
            span.addTag(tag);
            expect(tracer._tracer._reporter.spans).to.be.empty;
            span.finish();
            expect(tracer._tracer._reporter.spans).to.have.lengthOf(1);
            expect(tracer._tracer._reporter.spans[0]._tags).to.deep.include({ key: 'tagKey', value: 'tagValue' });
        });
        it('should add multiple tags', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test',
                },
                tracerOptions: {
                    reporter: new InMemoryReporter()
                }

            });
            const span = tracer.startSpan({ name: 'test1' });
            const tag = { tag1: 'val1', tag2: 'val2' };
            span.addTag(tag);
            expect(tracer._tracer._reporter.spans).to.be.empty;
            span.finish();
            expect(tracer._tracer._reporter.spans).to.have.lengthOf(1);
            expect(tracer._tracer._reporter.spans[0]._tags).to.deep.include({ key: 'tag1', value: 'val1' });
            expect(tracer._tracer._reporter.spans[0]._tags).to.deep.include({ key: 'tag2', value: 'val2' });
        });

        it('should finish span with child', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test',
                },
                tracerOptions: {
                    reporter: new InMemoryReporter()
                }

            });
            const parent = tracer.startSpan({ name: 'parent' });
            expect(tracer._getSpanStack(parent.id)).to.have.lengthOf(1);
            const span = tracer.startSpan({ id: parent.id, name: 'test1', parentRelationship: tracer.parentRelationships.childOf });
            expect(tracer._getSpanStack(span.id)).to.have.lengthOf(2);
            expect(tracer._tracer._reporter.spans).to.be.empty;
            span.finish();
            expect(tracer._getSpanStack(span.id)).to.have.lengthOf(1);
            parent.finish();
            expect(tracer._getSpanStack(span.id)).to.be.empty;
            expect(tracer._tracer._reporter.spans).to.have.lengthOf(2);
            expect(tracer._tracer._reporter.spans[0].context().parentIdStr).to.eql(tracer._tracer._reporter.spans[1].context().spanIdStr);
        });
        it('should finish span with external child', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test',
                },
                tracerOptions: {
                    reporter: new InMemoryReporter()
                }

            });
            const parent = tracer.startSpan({ name: 'parent' });
            tracer._spanStacks.clear();
            expect(tracer._getSpanStack(parent.id)).to.have.lengthOf(0);
            const span = tracer.startSpan({
                id: parent.id,
                name: 'test1',
                parentRelationship: tracer.parentRelationships.childOf,
                parent: parent.context()
            });
            expect(tracer._getSpanStack(parent.id)).to.have.lengthOf(1);
            expect(tracer._tracer._reporter.spans).to.be.empty;
            span.finish();
            expect(tracer._getSpanStack(parent.id)).to.have.lengthOf(0);
            parent.finish();
            expect(tracer._getSpanStack(parent.id)).to.be.empty;
            expect(tracer._tracer._reporter.spans).to.have.lengthOf(2);
            expect(tracer._tracer._reporter.spans[0].context().parentIdStr).to.eql(tracer._tracer._reporter.spans[1].context().spanIdStr);
        });
        it('should finish span with default child relationship', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test',
                },
                tracerOptions: {
                    reporter: new InMemoryReporter()
                }

            });
            const parent = tracer.startSpan({ name: 'parent' });
            expect(tracer._getSpanStack(parent.id)).to.have.lengthOf(1);
            const span = tracer.startSpan({ id: parent.id, name: 'test1' });
            expect(tracer._getSpanStack(parent.id)).to.have.lengthOf(2);
            expect(tracer._tracer._reporter.spans).to.be.empty;
            span.finish();
            expect(tracer._getSpanStack(parent.id)).to.have.lengthOf(1);
            parent.finish();
            expect(tracer._getSpanStack(parent.id)).to.be.empty;
            expect(tracer._tracer._reporter.spans).to.have.lengthOf(2);
            expect(tracer._tracer._reporter.spans[0].context().parentIdStr)
                .to.eql(tracer._tracer._reporter.spans[1].context().spanIdStr);
        });
        it('should not add child if stack is empty', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test',
                },
                tracerOptions: {
                    reporter: new InMemoryReporter()
                }

            });
            // expect(tracer._spanStack).to.be.empty;
            const parent = tracer.startSpan({ name: 'parent', parentRelationship: tracer.parentRelationships.childOf });
            parent.finish();
            expect(tracer._tracer._reporter.spans[0].context().parentIdStr).to.not.exist;
        });
        it('should finish span with relative parent', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test',
                },
                tracerOptions: {
                    reporter: new InMemoryReporter()
                }

            });
            const parent = tracer.startSpan({ name: 'parent' });
            const span = tracer.startSpan({ id: parent.id, name: 'test1', parentRelationship: tracer.parentRelationships.follows });
            expect(tracer._tracer._reporter.spans).to.be.empty;
            span.finish();
            parent.finish();
            expect(tracer._tracer._reporter.spans).to.have.lengthOf(2);
            expect(tracer._tracer._reporter.spans[0].context().parentIdStr).to.eql(tracer._tracer._reporter.spans[1].context().spanIdStr);
        });

        it('should return null span when popping empty stack', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test',
                },
                tracerOptions: {
                    reporter: new InMemoryReporter()
                }
            });
            expect(tracer._getSpanStack('dummyId')).to.be.empty;
            expect(tracer.topSpan('dummyId')).to.not.exist;
            expect(tracer.pop('dummyId')).to.not.exist;
        });
        it('should return the latest span when calling topSpan', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test',
                },
                tracerOptions: {
                    reporter: new InMemoryReporter()
                }
            });
            const first = tracer.startSpan({ name: 'first', id: 'id1' });
            const second = tracer.startSpan({ name: 'second', id: 'id1' });
            let top = tracer.topSpan('id1');
            expect(top).to.eql(second);
            top.finish();
            top = tracer.topSpan('id1');
            expect(top).to.eql(first);
        });
        it('should support 2 span stacks', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test',
                },
                tracerOptions: {
                    reporter: new InMemoryReporter()
                }
            });
            const id1Parent = tracer.startSpan({ id: 'id1', name: 'parent' });
            const id1span = tracer.startSpan({ id: id1Parent.id, name: 'test1', parentRelationship: tracer.parentRelationships.follows });

            const id2Parent = tracer.startSpan({ id: 'id2', name: 'parent' });
            const id2span = tracer.startSpan({ id: id2Parent.id, name: 'test1', parentRelationship: tracer.parentRelationships.follows });

            id1span.finish();
            id1Parent.finish();
            id2span.finish();
            id2Parent.finish();
            expect(tracer._tracer._reporter.spans).to.have.lengthOf(4);
            expect(tracer._tracer._reporter.spans[0].context().parentIdStr).to.eql(tracer._tracer._reporter.spans[1].context().spanIdStr);
            expect(tracer._tracer._reporter.spans[2].context().parentIdStr).to.eql(tracer._tracer._reporter.spans[3].context().spanIdStr);
        });

        it('should support 2 span stacks different order', async () => {
            await tracer.init({
                tracerConfig: {
                    serviceName: 'test',
                },
                tracerOptions: {
                    reporter: new InMemoryReporter()
                }
            });
            const id1Parent = tracer.startSpan({ id: 'id1', name: 'parent' });
            const id1span = tracer.startSpan({ id: id1Parent.id, name: 'test1', parentRelationship: tracer.parentRelationships.follows });

            const id2Parent = tracer.startSpan({ id: 'id2', name: 'parent' });
            const id2span = tracer.startSpan({ id: id2Parent.id, name: 'test1', parentRelationship: tracer.parentRelationships.follows });

            id1span.finish();
            id2span.finish();
            id1Parent.finish();
            id2Parent.finish();
            expect(tracer._tracer._reporter.spans).to.have.lengthOf(4);
            expect(tracer._tracer._reporter.spans[0].context().parentIdStr).to.eql(tracer._tracer._reporter.spans[2].context().spanIdStr);
            expect(tracer._tracer._reporter.spans[1].context().parentIdStr).to.eql(tracer._tracer._reporter.spans[3].context().spanIdStr);
        });
    });
});
