import __polyfill from "babel-polyfill";
import should from 'should';
import core from "../isotropy-core";

const mockKoa = () => {
    let _listening = false;
    return {
        listening: () => _listening,
        ctor: function() {
            this.listen = () => {
                _listening = true;
            };
        }
    };
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

    it(`Should return isotropy function`, async () => {
        const Koa = mockKoa();
        const Plugin = mockPlugin();
        const plugin = new Plugin.ctor();
        const isotropy = core(Koa.ctor, { "mock": plugin });
        const apps = [
            { type: "mock", path: "/" }
        ];
        await isotropy(apps, {});
        Koa.listening().should.be.true();
        Plugin.gotDefaults().should.be.true();
        Plugin.setup().should.be.true();
    });


    it(`Should not call listen if koa is passed in`, async () => {
        const Koa = mockKoa();
        const Plugin = mockPlugin();
        const plugin = new Plugin.ctor();
        const isotropy = core(Koa.ctor, { "mock": plugin });
        const apps = [
            { type: "mock", path: "/" }
        ];
        await isotropy(apps, { defaultInstance: new Koa.ctor() });
        Koa.listening().should.be.false();
        Plugin.gotDefaults().should.be.true();
        Plugin.setup().should.be.true();
    });
});
