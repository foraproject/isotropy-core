import __polyfill from "babel-polyfill";
import should from 'should';
import Router from "isotropy-router";
import querystring from "querystring";
import http from "http";
import core from "../isotropy-core";

const makeRequest = (host, port, path, method, headers, _postData) => {
  return new Promise((resolve, reject) => {
    const postData = (typeof _postData === "string") ? _postData : querystring.stringify(_postData);
    const options = { host, port, path, method, headers };

    let result = "";
    const req = http.request(options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function(data) { result += data; });
      res.on('end', function() { resolve({ result, res }); });
    });
    req.on('error', function(e) { reject(e); });
    req.write(postData);
    req.end();
  });
};

const mockPlugin = () => {
  let _gotDefaults = false;
  let _setup = false;
  return {
    gotDefaults: () => _gotDefaults,
    setup: () => _setup,
    ctor: function() {
      Object.assign(this, {
        name: "mock",
        getDefaults:  (item) => {
          _gotDefaults = true;
          return item;
        },
        setup: async (appConfig, router) => {
          if (appConfig.routes) {
            router.add(appConfig.routes);
          }
          _setup = true;
        }
      });
    }
  };
};

describe("Isotropy Core", () => {

  it(`returns isotropy function`, async () => {
    const Plugin = mockPlugin();
    const plugin = new Plugin.ctor();
    const isotropy = core([plugin], http);
    const apps = [
      { type: "mock", path: "/" }
    ];
    const result = await isotropy(apps);
    result.router.should.not.be.empty();
    Plugin.gotDefaults().should.be.true();
    Plugin.setup().should.be.true();
  });


  it(`uses external router if provided as argument`, async () => {
    const Plugin = mockPlugin();
    const plugin = new Plugin.ctor();
    const isotropy = core([plugin], http);
    const apps = [
      { type: "mock", path: "/" }
    ];
    const router = new Router();
    const result = await isotropy(apps, { router });
    result.router.should.equal(router);
    Plugin.gotDefaults().should.be.true();
    Plugin.setup().should.be.true();
  });


  it(`uses external handler if provided as argument`, async () => {
    let calledCustomHandler = false;
    const Plugin = mockPlugin();
    const plugin = new Plugin.ctor();
    const isotropy = core([plugin], http);
    const apps = [
      { type: "mock", path: "/" }
    ];
    const handler = (defaultRouter) => (req, res) => {
      calledCustomHandler = true;
      defaultRouter.doRouting(req, res);
    };
    const result = await isotropy(apps, { handler });
    const data = await makeRequest("localhost", result.server.address().port, "/", "GET", { 'Content-Type': 'application/x-www-form-urlencoded' });
    Plugin.gotDefaults().should.be.true();
    Plugin.setup().should.be.true();
  });


  it(`calls onError if provided`, async () => {
    const Plugin = mockPlugin();
    const plugin = new Plugin.ctor();
    const isotropy = core([plugin], http);

    const routes = [
      { url: "/", method: "GET", handler: async (req, res) => { throw "BOOM!"; } }
    ];
    const appConfig = { type: "mock", path: "/", routes };

    let error, data;
    const isotropyConfig = {
      dir: __dirname,
      onError: (req, res, e) => {
        error = e;
        res.statusCode = 200;
        res.end(e.toString());
      }
    };
    const result = await isotropy([appConfig], isotropyConfig);
    try {
      data = await makeRequest("localhost", result.server.address().port, "/", "GET", { 'Content-Type': 'application/x-www-form-urlencoded' });
    } finally {
      data.result.should.equal("BOOM!");
      error.should.equal("BOOM!");
    }
  });


  it(`returns error message`, async () => {
    const Plugin = mockPlugin();
    const plugin = new Plugin.ctor();
    const isotropy = core([plugin], http);

    const routes = [
      { url: "/", method: "GET", handler: async (req, res) => { throw "BOOM!"; } }
    ];
    const appConfig = { type: "mock", path: "/", routes };

    let data;
    const isotropyConfig = {
      dir: __dirname
    };
    const result = await isotropy([appConfig], isotropyConfig);
    try {
      data = await makeRequest("localhost", result.server.address().port, "/", "GET", { 'Content-Type': 'application/x-www-form-urlencoded' });
    } finally {
      data.result.should.equal("BOOM!");
    }
  });
});
