const { tracer } = require('../index');
const main = async () => {
    await tracer.init({
        tracerConfig: {
            serviceName: 'test-service',
            reporter: {
                agentHost: 'localhost',
                agentPort: 6832
            }
        }
    });


    const span = tracer.startSpan({ name: 'op1' });
    span.addTag({ key: 'val' });
    span.finish('Oh No');
};
main();
