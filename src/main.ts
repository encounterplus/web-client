import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { takeLinkCode } from './app/shared/services/session.service';

if (environment.production) {
  enableProdMode();
}

// a join link's code leaves the address before the router reads it
takeLinkCode();

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
