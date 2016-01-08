import __polyfill from "babel-polyfill";
import should from 'should';
import core from "../isotropy-core";
import koa from "koa";

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
        const result = await isotropy(apps, {});
        result.koa.should.not.be.empty();
        Plugin.gotDefaults().should.be.true();
        Plugin.setup().should.be.true();
    });


    it(`Should use external koa instance if provided as argument`, async () => {
        const Plugin = mockPlugin();
        const plugin = new Plugin.ctor();
        const isotropy = core({ "mock": plugin });
        const apps = [
            { type: "mock", path: "/" }
        ];
        const defaultInstance = new koa();
        const result = await isotropy(apps, { defaultInstance });
        result.koa.should.equal(defaultInstance);
        Plugin.gotDefaults().should.be.true();
        Plugin.setup().should.be.true();
    });
});
