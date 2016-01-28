import __polyfill from "babel-polyfill";
import should from 'should';
import Router from "isotropy-router";
import core from "../isotropy-core";

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

  it(`Should return isotropy function`, async () => {
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


  it(`Should use external router if provided as argument`, async () => {
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
});
