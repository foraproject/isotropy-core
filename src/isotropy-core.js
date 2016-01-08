/* @flow */
import type { KoaType } from "./flow/koa.js";
import mount from "isotropy-mount";

type Plugin = {
    getDefaults: (app: Object) => Object,
    setup: (appSettings: Object, instance: KoaType, options: PluginOptions) => Promise
};

type Plugins = {
    [key: string]: Plugin
}

type PluginOptions = {
    dir: string,
    port: number,
    graphiql?: boolean
}

type IsotropyOptionsType = {
    dir: string,
    port: number,
    plugins: Plugins,
    defaultInstance: KoaType
};

export type IsotropyResultType = {
    koa: KoaType
};

const getIsotropy = function(koa, plugins) {
    return async function(apps: Object, options: IsotropyOptionsType) : Promise<IsotropyResultType> {
        const dir = options.dir || __dirname;
        const port = options.port || 8080;
        const defaultInstance: KoaType = options.defaultInstance || new koa();
        
        const pluginOptions = {
            dir,
            port
        };

        for (let app of apps) {
            const plugin: Plugin = plugins[app.type];
            const appSettings = plugin.getDefaults(app);
            if (appSettings.path === "/") {
                await plugin.setup(appSettings, defaultInstance, pluginOptions);
            } else {
                const newInstance = new koa();
                await plugin.setup(appSettings, newInstance, pluginOptions);
                defaultInstance.use(mount(appSettings.path, newInstance));
            }
        }

        // If we were passed in defaultInstance via options, listen() must be done at callsite.
        if (!options.defaultInstance) {
            defaultInstance.listen(port);
        }

        return {
            koa: defaultInstance
        };
    };
};

export default getIsotropy;
