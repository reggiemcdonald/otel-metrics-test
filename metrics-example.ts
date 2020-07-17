import { MeterProvider } from '@opentelemetry/metrics';
import { MetricExporter } from '@google-cloud/opentelemetry-cloud-monitoring-exporter';

const logger = {
  debug: console.log,
  warn: console.log,
  info: console.log,
  error: console.log,
}

const projectId = process.env.PROJECT_ID;
if (!projectId) {
  throw new Error('missing PROJECT_ID');
}

const exporter = new MetricExporter({
  logger,
  projectId,
});

// Register the exporter
const meter = new MeterProvider({
  exporter,
  interval: 60000,
}).getMeter('test-meter');

// Create the instruments
const counter = meter.createCounter('test.counter', {
  labelKeys: ['name'],
  description: 'a basic counter instrument',
}).bind({
  name: 'test-usage-1',
});
const observer = meter.createObserver('system.usage', {
  description: 'system usage',
  labelKeys: ['pid', 'usageType'],
}).bind({
  usageType: 'system'
});

// record system usage 
observer.setCallback(observerResult => {
  observerResult.observe(() => process.cpuUsage().system, {
    pid: `${process.pid}`,
  });
});

// record the counter
const delay = () => {
  return new Promise(resolve => {
    setTimeout(resolve, 10000);
  });
};

const run = async () => {
  let i = 0;
  const upOrDown = () => {
    const rand = Math.random();
    return rand > 0.5 ? 
      rand * 5 :
      rand * -5;
  }
  while (true) {
    console.log(`Beginning iteration ${++i}`);
    counter.add(Math.random() * 5);
    await delay();
  }
};

run()
  .catch(console.log);