import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// v1.0.3 - disable hydration
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
