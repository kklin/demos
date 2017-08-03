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

  // The Node module isn't designed well for composition right now, so we have
  // to access this.app._app directly. Until this is fixed, silence the linter
  // warning about underscore dangles.
  // eslint-disable-next-line no-underscore-dangle
  this.proxy = haproxy.singleServiceLoadBalancer(1, this.app._app);

  this.app.connect(this.mongo.port, this.mongo);
  this.proxy.allowFrom(publicInternet, haproxy.exposedPort);

  this.deploy = function deploy(deployment) {
    deployment.deploy(this.app);
    deployment.deploy(this.mongo);
    deployment.deploy(this.proxy);
  };
}

module.exports = TodoApp;
