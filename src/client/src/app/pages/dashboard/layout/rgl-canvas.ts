import { ApplicationRef, Component, ComponentFactoryResolver, Injector, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReactGridLayoutStore } from './rgl.store';
import { DashboardStore, RglRect, PanelHelper, PluginActivator, Plugin, Panel, BaseDasboardComponent } from 'common';

import { ReactGridLayoutAdapterComponent } from './rgl-adapter';
import { DashboardPanelComponent } from '../panel/panel';
import { Router } from '@angular/router';


@Component({
  selector: 'dashboard-canvas',
  providers: [ReactGridLayoutStore],
  styleUrls: ['./rgl-canvas.scss'],
  encapsulation: ViewEncapsulation.None,
  template: `<div class="rgl-container" id="rgl-host" ></div>`
})
export class DashboardCanvasComponent extends BaseDasboardComponent {

  attachedPanels = new Map();

	layoutSubs : Subscription;

	get editable(){
    //return this.dashboard && this.dashboard.editable;
    return true;
  }

  get panels(): Panel[]{
    return this.dashboard.data.panels;
  }
 	
	constructor( 
    private resolver: ComponentFactoryResolver,
    private app: ApplicationRef,
    private layout: ReactGridLayoutStore,
    private injector: Injector,
    private router: Router,
    store: DashboardStore ){
      super( store )
  }

  ngOnInit(){
    ReactGridLayoutAdapterComponent.create('rgl-host', this.layout)
  }

  ngOnDestroy() {
    console.log( "destroy DashboardGridLayoutComponent" )
    ReactGridLayoutAdapterComponent.destroy('rgl-host');

    super.ngOnDestroy();
    
    this.destroyPanels();
  }  

  onPreBackEnd(){
    console.log( "onPreBackEnd" );
    //this.destroyPanels();
  }

  destroyPanels(){
    this.attachedPanels.forEach( ( v, k ) => v.destroy() );
  }

  onDashboardReady(){
    this.destroyPanels();
    this.attachedPanels.clear();
    this.layout.clear();
    this.layoutSubs?.unsubscribe();

    this.layoutSubs = this
      .layout
      .changed
      .subscribe( x => this.onLayoutChanged( x ) );
    
    this.layout.init( PanelHelper.toRects( this.dashboard ) );
  }

  onLayoutChanged( panels: RglRect[] ){
    panels.forEach( p => {

      let existingPanel = this.attachedPanels.get( +p.i )?.instance.panel ?? this.attachPanel( p );

      existingPanel.rect = {
        x: p.x,
        y: p.y,
        w: p.w,
        h: p.h
      }
    } )
  }

  attachPanel( pf: RglRect ) {
    const index = this.panels.findIndex( x => x.id == +pf.i );

    if( -1 == index ){
      return;
    } 

    const p = this.panels[ index ];

    const hostElement = document.getElementById( `panel${pf.i}` )

    const factory = this
      .resolver
      .resolveComponentFactory( DashboardPanelComponent );

    const injector = PluginActivator.extendInjector( p, this.injector );
     
    const ref = factory.create(injector, [], hostElement);
    this.app.attachView(ref.hostView);

    this.attachedPanels.set( +pf.i, ref );

    ref
      .instance
      .remove
      .subscribe( x => this.removePanel( p ));

    return p;
  }

  addPanel( p: Plugin ){
    const ids = this.panels.map( x => x.id );

    const nextId = Math.max( ...ids ) + 1;

    const panel = new Panel();
    panel.id = nextId;
    panel.type = p.id; 
    panel.title = `panel #${nextId}`;

    this.panels.push( panel );

    this.layout.add( nextId );
  }

  removePanel( p: Panel ){
    const index = this.panels.indexOf( p );
    this.panels.splice( index, 1 );
    this.layout.remove( p.id );

    const widget = this.attachedPanels.get( p.id );
    this.attachedPanels.delete( p.id );
    widget.destroy();
  }
}