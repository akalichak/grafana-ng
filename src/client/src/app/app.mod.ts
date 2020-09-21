import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { NgModule } from '@angular/core';

import { AppComponent } from './app';
import { AppRoutingModule } from './app.mod-r';
import { SidemenuComponent } from './pages/layout/sidemenu/sidemenu';
import { SidebarTopComponent } from './pages/layout/sidemenu/top/top';
import { SidebarBottomComponent } from './pages/layout/sidemenu/bottom/bottom';

import { MessageService } from 'primeng/api';
import { JwtHelperService } from '@auth0/angular-jwt';
import { OrgSettingsComponent } from './pages/org/settings/org-settings';
import { UsersComponent } from './pages/users/org/org-users';
import { NotFoundComponent } from './pages/base/not-found/not-found';
import { EdUilibModule, Notes } from 'uilib';
import { EdCommonModule, NavigationProvider, AuthService } from 'common';
import { PluginLoader } from './plugins/loader/plugin-loader.s';


@NgModule({
  declarations: [
    AppComponent,

    SidemenuComponent,
    SidebarTopComponent,
    SidebarBottomComponent,
    
    UsersComponent,

    OrgSettingsComponent,

    NotFoundComponent
    

  ],
  imports: [
    BrowserModule,
    
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,

    AppRoutingModule,
    EdCommonModule,
    EdUilibModule,

  ],
  providers: [
    NavigationProvider,
    JwtHelperService,
    AuthService,
    PluginLoader,

    MessageService,
    Notes,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  
}