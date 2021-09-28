import packageInfo from '../../package.json'

export const environment = {
  production: true,
  config: {
    defaults: {
      AUTO_RECONNECT: true
    }
  },
  version: packageInfo.version
};
