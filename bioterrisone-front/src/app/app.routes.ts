// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { ServiciosComponent } from './components/servicios/servicios.component';
import { SobreNosotrosComponent } from './components/sobre-nosotros/sobre-nosotros.component';
import { ContactanosComponent } from './components/contactanos/contactanos.component';
import { MapComponent } from './components/map/map.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'servicios', component: ServiciosComponent },
  { path: 'sobre-nosotros', component: SobreNosotrosComponent },
  { path: 'contactanos', component: ContactanosComponent },
  { path: 'map', component: MapComponent },
  { path: '**', redirectTo: '' }
];