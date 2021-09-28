import metaInfo from '../meta.json'

export const environment = {
  production: true,
  config: {
    defaults: {
      AUTO_RECONNECT: true
    }
  },
  version: metaInfo.version
};
