/* @flow */
import http from "http";
import Router from "isotropy-router";


type PluginType = {
  getDefaults: (app: Object) => Object,
  setup: (appSettings: Object, router: Router, options: PluginOptions) => Promise
};

type Plugins = {
  [key: string]: PluginType
}

type PluginOptions = {
  dir: string,
  port: number,
  graphiql?: boolean
}

type IsotropyOptionsType = {
  dir?: string,
  port?: number,
  router?: Router
};

export type IsotropyResultType = {
  router: Router,
  server?: http.Server
};

type IsotropyFnType = (apps: Object, options: IsotropyOptionsType) => Promise<IsotropyResultType>;

const getIsotropy = function(plugins: Plugins) : IsotropyFnType {
  return async function(apps: Object, options: IsotropyOptionsType = {}) : Promise<IsotropyResultType> {
    const defaultRouter = options.router || new Router();

    const dir = options.dir || __dirname;
    const port = options.port || 8080;

    const pluginOptions = {
      dir,
      port
    };

    for (let app of apps) {
      const plugin: PluginType = plugins[app.type];
      const appSettings = plugin.getDefaults(app);
      if (appSettings.path === "/") {
        await plugin.setup(appSettings, defaultRouter, pluginOptions);
      } else {
        const router = new Router();
        await plugin.setup(appSettings, router, pluginOptions);
        defaultRouter.mount(appSettings.path, router);
      }
    }

    if (!options.router) {
      const server = http.createServer((req, res) => defaultRouter.doRouting(req, res));
      return { server, router: defaultRouter };
    } else {
      return { router: defaultRouter };
    }

  };
};

export default getIsotropy;
