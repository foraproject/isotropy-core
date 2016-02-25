/* @flow */
import http from "http";
import promisify from "nodefunc-promisify";
import Router from "isotropy-router";

import type { IncomingMessage, ServerResponse } from "./flow/http";

export type PluginType = {
  getDefaults: (app: Object) => Object,
  setup: (appSettings: Object, router: Router, options: PluginOptions) => Promise
};

export type Plugins = {
  [key: string]: PluginType
}

export type PluginOptions = {
  dir: string,
  port: number
}

export type IsotropyOptionsType = {
  dir?: string,
  port?: number,
  router?: Router,
  handler?: (router: Router) => (req: IncomingMessage, res: ServerResponse) => void
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
    const port = options.port || 0;

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

    //if Router was passed in, we are going to assume that server was created outside.
    const onError = options.onError ||
      ((req, res, e) => {
        res.statusCode = 200;
        res.end(e.toString());
      });
    if (!options.router) {
      const handler = options.handler ?
        options.handler(defaultRouter) :
        ((req, res) => {
          const promise = defaultRouter.doRouting(req, res);
          promise.catch((e) => onError(req, res, e));
          return promise;
        });
      const server = http.createServer(handler);
      const listen = promisify(server.listen.bind(server));
      await server.listen(port);
      return { server, router: defaultRouter };
    } else {
        return { router: defaultRouter };
    }
  };
};

export default getIsotropy;
