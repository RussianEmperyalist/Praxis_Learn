import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const vm = require('vm');
const fs = require('fs');
const code = fs.readFileSync('./vendor/js-yaml.min.js', 'utf8');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
globalThis.jsyaml = sandbox.jsyaml;

import { K8sSim } from './k8s-simulator.js';

function assertEqual(actual, expected, msg) {
  if (!deepEqual(actual, expected)) {
    console.error('FAIL: ' + msg);
    console.error('  expected:', JSON.stringify(expected));
    console.error('  actual:', JSON.stringify(actual));
    process.exitCode = 1;
  } else {
    console.log('PASS: ' + msg);
  }
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const sim = new K8sSim();

// Test 1: kubectl version
let r = sim.execute('kubectl version');
assertEqual(r.output.includes('Server Version: 1.29'), true, 'version shows server version');

// Test 2: kubectl get nodes
r = sim.execute('kubectl get nodes');
assertEqual(r.output.some(l => l.includes('minikube')), true, 'get nodes shows minikube');

// Test 3: kubectl get pods (empty)
r = sim.execute('kubectl get pods');
assertEqual(r.output.some(l => l.includes('No resources found')), true, 'get pods empty shows no resources');

// Test 4: kubectl apply -f with valid Pod manifest
sim.setManifest(`apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
spec:
  containers:
  - name: nginx
    image: nginx:1.21
`);
r = sim.execute('kubectl apply -f nginx-pod');
assertEqual(r.output.includes('pod/nginx-pod created'), true, 'apply creates pod');
assertEqual(sim.state.pods.some(p => p.name === 'nginx-pod'), true, 'pod exists in state');

// Test 5: kubectl get pods (after apply)
r = sim.execute('kubectl get pods');
assertEqual(r.output.some(l => l.includes('nginx-pod')), true, 'get pods shows nginx-pod');

// Test 6: kubectl describe pod
r = sim.execute('kubectl describe pod nginx-pod');
assertEqual(r.output.some(l => l.includes('nginx-pod')), true, 'describe pod shows pod details');

// Test 7: kubectl apply with Deployment
sim.execute('kubectl apply -f');
sim.setManifest(`apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-deploy
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: web
        image: nginx:1.21
`);
r = sim.execute('kubectl apply -f web-deploy');
assertEqual(r.output.includes('deployment.apps/web-deploy created'), true, 'apply creates deployment');
assertEqual(sim.state.deployments.some(d => d.name === 'web-deploy'), true, 'deployment exists');

// Test 8: kubectl get deployments
r = sim.execute('kubectl get deployments');
assertEqual(r.output.some(l => l.includes('web-deploy')), true, 'get deployments shows web-deploy');

// Test 9: kubectl scale deployment
r = sim.execute('kubectl scale deployment web-deploy --replicas=5');
assertEqual(r.output.some(l => l.includes('scaled')), true, 'scale reports success');
assertEqual(sim.state.deployments.find(d => d.name === 'web-deploy').replicas, 5, 'deployment scaled to 5');

// Test 10: kubectl apply with Service
sim.setManifest(`apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  type: NodePort
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: web
`);
r = sim.execute('kubectl apply -f web-service');
assertEqual(r.output.includes('service/web-service created'), true, 'apply creates service');

// Test 11: kubectl get services
r = sim.execute('kubectl get svc');
assertEqual(r.output.some(l => l.includes('web-service')), true, 'get svc shows web-service');

// Test 12: kubectl apply with invalid YAML
sim.setManifest('invalid: yaml: content:');
r = sim.execute('kubectl apply -f bad');
assertEqual(r.error !== null, true, 'apply with invalid YAML reports error');

// Test 13: kubectl apply with invalid manifest (missing kind)
sim.setManifest(`apiVersion: v1
metadata:
  name: no-kind
`);
r = sim.execute('kubectl apply -f no-kind');
assertEqual(r.error && r.error.includes('kind'), true, 'apply without kind reports error');

// Test 14: kubectl delete pod
r = sim.execute('kubectl delete pod nginx-pod');
assertEqual(r.output.includes('pod/nginx-pod deleted'), true, 'delete pod reports success');
assertEqual(sim.state.pods.some(p => p.name === 'nginx-pod'), false, 'pod removed');

// Test 15: kubectl delete nonexistent pod
r = sim.execute('kubectl delete pod nonexistent');
assertEqual(r.error !== null, true, 'delete nonexistent reports error');

// Test 16: kubectl apply with ConfigMap
sim.setManifest(`apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  key: value
`);
r = sim.execute('kubectl apply -f app-config');
assertEqual(r.output.includes('configmap/app-config created'), true, 'apply creates configmap');
assertEqual(sim.state.configmaps.some(c => c.name === 'app-config'), true, 'configmap exists');

// Test 17: kubectl apply with Secret
sim.setManifest(`apiVersion: v1
kind: Secret
metadata:
  name: app-secret
data:
  password: cGFzc3dvcmQ=
`);
r = sim.execute('kubectl apply -f app-secret');
assertEqual(r.output.includes('secret/app-secret created'), true, 'apply creates secret');
assertEqual(sim.state.secrets.some(s => s.name === 'app-secret'), true, 'secret exists');

// Test 18: kubectl logs
sim.setManifest(`apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
spec:
  containers:
  - name: nginx
    image: nginx:1.21
`);
sim.execute('kubectl apply -f nginx-pod');
r = sim.execute('kubectl logs nginx-pod');
assertEqual(r.output.some(l => l.includes('nginx')), true, 'logs shows nginx output');

// Test 19: kubectl exec
r = sim.execute('kubectl exec -it nginx-pod -- ls /');
assertEqual(r.output.some(l => l.includes('PID')), true, 'exec shows process list');

// Test 20: command history tracked
assertEqual(sim.state.commandHistory.length >= 10, true, 'command history tracked');

console.log('\nAll K8sSim tests completed.');

