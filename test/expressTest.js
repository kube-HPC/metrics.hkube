const metrics = require('../index');
const {expect} = require('chai');
const client = require('prom-client');
const RestServer = require('@hkube/rest-server');
const httpMocks = require('node-mocks-http');
const getPort = require('get-port');
const config = {
    metrics: {

    }
};

let server;
describe('With RestServer or internal server', () => {
    beforeEach(() => {
        client.register.clear();
    });
    
    it('should init without server', async () => {
        await metrics.init({
        });
    });

    describe('with RestServer', () => {
        beforeEach(() => {
            server = new RestServer();
        });
        afterEach(async () => {
            if (server) {
                await server.stop();
            }
        });
        it('should init with express', async () => {
            await metrics.init(config.metrics);
            const port = await getPort();
            const {app} = await server.start({
                routes: [metrics.getRouter()],
                port
            });
            const measure = metrics.addTimeMeasure({
                name: 'm1',
                labels: ['l1', 'l2']
            });
            const id = measure.start({
                labelValues: {
                    l1: 1,
                    l2: 2
                }
            });
            measure.end({id});
            const mockResponse = httpMocks.createResponse();
            const mockRequest = httpMocks.createRequest({
                method: 'GET',
                url: '/metrics'
            });
            app.handle(mockRequest, mockResponse);
            expect(mockResponse.statusCode).to.eq(200);
            expect(mockResponse._getData()).to.include('m1_counter{l1="1",l2="2"} 1');
            expect(mockResponse._getData()).to.include('m1_histogram_count{l1="1",l2="2"} 1');
        });
        it('should init with express custom path', async () => {
            await metrics.init({
                server: {
                    path: '/myMetrics'
                }
            });
            const port = await getPort();
            const {app} = await server.start({
                routes: [metrics.getRouter()],
                port
            });
            const measure = metrics.addTimeMeasure({
                name: 'm1',
                labels: ['l1', 'l2']
            });
            const id = measure.start({
                labelValues: {
                    l1: 1,
                    l2: 2
                }
            });
            measure.end({id});
            const mockResponse = httpMocks.createResponse();
            const mockRequest = httpMocks.createRequest({
                method: 'GET',
                url: '/myMetrics'
            });
            app.handle(mockRequest, mockResponse);
            expect(mockResponse.statusCode).to.eq(200);
            expect(mockResponse._getData()).to.include('m1_counter{l1="1",l2="2"} 1');
            expect(mockResponse._getData()).to.include('m1_histogram_count{l1="1",l2="2"} 1');
        });
    });

    describe('with internal server', () => {
        afterEach(async () => {
            if (metrics._server) {
                await metrics._server.stop();
            }
        });
        it('should create server', async () => {
            const port = await getPort();
            await metrics.init({
                server: {
                    port
                }
            });
            const app = metrics._server._app;
            const measure = metrics.addTimeMeasure({
                name: 'm1',
                labels: ['l1', 'l2']
            });
            const id = measure.start({
                labelValues: {
                    l1: 1,
                    l2: 2
                }
            });
            measure.end({id});
            const mockResponse = httpMocks.createResponse();
            const mockRequest = httpMocks.createRequest({
                method: 'GET',
                url: '/metrics'
            });
            app.handle(mockRequest, mockResponse);
            expect(mockResponse.statusCode).to.eq(200);
            expect(mockResponse._getData()).to.include('m1_counter{l1="1",l2="2"} 1');
            expect(mockResponse._getData()).to.include('m1_histogram_count{l1="1",l2="2"} 1');
        });
        it('should create server with custom path', async () => {
            const port = await getPort();
            await metrics.init({
                server: {
                    port,
                    path: '/myMetrics'
                }
            });
            const app = metrics._server._app;
            const measure = metrics.addTimeMeasure({
                name: 'm1',
                labels: ['l1', 'l2']
            });
            const id = measure.start({
                labelValues: {
                    l1: 1,
                    l2: 2
                }
            });
            measure.end({id});
            const mockResponse = httpMocks.createResponse();
            const mockRequest = httpMocks.createRequest({
                method: 'GET',
                url: '/myMetrics'
            });
            app.handle(mockRequest, mockResponse);
            expect(mockResponse.statusCode).to.eq(200);
            expect(mockResponse._getData()).to.include('m1_counter{l1="1",l2="2"} 1');
            expect(mockResponse._getData()).to.include('m1_histogram_count{l1="1",l2="2"} 1');
        });
    });

    describe('with middleware', () => {
        beforeEach(() => {
            server = new RestServer();
        });
        afterEach(async () => {
            if (server) {
                await server.stop();
            }
        });

        it('should init with middleware', async () => {
            await metrics.init(config.metrics);
            const port = await getPort();
            const middleware = metrics.getMiddleware();
            metrics.getMiddleware();
            const {app} = await server.start(Object.assign({
                routes: [metrics.getRouter(), {
                    route: '/testRoute',
                    router: (req, res, next) => {
                        res.json('ok');
                        next();
                    }
                }],
                port
            }, middleware));
            const mockResponse = httpMocks.createResponse();
            const mockRequest = httpMocks.createRequest({
                method: 'GET',
                url: '/testRoute'
            });
            app.handle(mockRequest, mockResponse);
            expect(metrics.metrics()).to.include('API_REQUEST_MEASURE_counter{method="GET",route="/testRoute",code="200"} 1');
            expect(metrics.metrics()).to.include('API_REQUEST_MEASURE_histogram_count{method="GET",route="/testRoute",code="200"} 1');
        });
    });
});
