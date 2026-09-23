import manifest from '../manifest.json'

export const environment = {
  production: true,
  config: {
    defaults: {
      AUTO_RECONNECT: true
    }
  },
  version: manifest.version
};
