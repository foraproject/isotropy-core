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
      this.getDefaults = (item) => {
        _gotDefaults = true;
        return item;
      };
      this.setup = async () => {
        _setup = true;
      };
    }
  };
};

describe("Isotropy Core", () => {

  it(`return isotropy function`, async () => {
    const Plugin = mockPlugin();
    const plugin = new Plugin.ctor();
    const isotropy = core({ "mock": plugin });
    const apps = [
      { type: "mock", path: "/" }
    ];
    const result = await isotropy(apps);
    result.router.should.not.be.empty();
    Plugin.gotDefaults().should.be.true();
    Plugin.setup().should.be.true();
  });


  it(`use external router if provided as argument`, async () => {
    const Plugin = mockPlugin();
    const plugin = new Plugin.ctor();
    const isotropy = core({ "mock": plugin });
    const apps = [
      { type: "mock", path: "/" }
    ];
    const router = new Router();
    const result = await isotropy(apps, { router });
    result.router.should.equal(router);
    Plugin.gotDefaults().should.be.true();
    Plugin.setup().should.be.true();
  });


  it(`use external handler if provided as argument`, async () => {
    let calledCustomHandler = false;
    const Plugin = mockPlugin();
    const plugin = new Plugin.ctor();
    const isotropy = core({ "mock": plugin });
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
});
