const haproxy = require('@quilt/haproxy');
const Mongo = require('@quilt/mongo');
const Node = require('@quilt/nodejs');
const { publicInternet } = require('@quilt/quilt');

function TodoApp(count) {
  const port = 80;
  this.mongo = new Mongo(count);
  this.app = new Node({
    nWorker: count,
    repo: 'https://github.com/quilt/node-todo.git',
    env: {
      PORT: port.toString(),
      MONGO_URI: this.mongo.uri('mean-example'),
    },
  });

  this.proxy = haproxy.simpleLoadBalancer(this.app.cluster);

  this.mongo.allowFrom(this.app.cluster, this.mongo.port);
  this.proxy.allowFrom(publicInternet, haproxy.exposedPort);

  this.deploy = function deploy(deployment) {
    deployment.deploy(this.app);
    deployment.deploy(this.mongo);
    deployment.deploy(this.proxy);
  };
}

module.exports = TodoApp;
