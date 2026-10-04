import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { applyAppearance, storedAppearance } from './app/shared/appearance';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

applyAppearance(storedAppearance());

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
