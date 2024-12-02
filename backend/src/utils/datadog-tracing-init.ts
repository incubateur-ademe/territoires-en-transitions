import tracer from 'dd-trace';

// initialized in a different file to avoid hoisting.
tracer.init({
  startupLogs: true,
  service: process.env.APPLICATION_NAME || 'backend',
});
export default tracer;
