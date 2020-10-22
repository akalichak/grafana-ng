import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { UserService } from '../user/user.s';
import { Dashboard, Panel } from './dashboard.m';
import { DashboardService } from './dashboard.s';

@Injectable()
export class DashboardStore {
  static readonly ROOT_MANAGEMENT = '/dashboards';

  uid: string;
  panelId : number; 
  existing: boolean;

  private dashboard: BehaviorSubject<Dashboard> = new BehaviorSubject(undefined);
  readonly dashboard$: Observable<Dashboard> = this.dashboard.asObservable();

  private panel: BehaviorSubject<Panel> = new BehaviorSubject(null);
  readonly panel$: Observable<Panel> = this.panel.asObservable();

  private error: BehaviorSubject<Error> = new BehaviorSubject(undefined);
  readonly error$: Observable<Error> = this.error.asObservable();

  private get selectedPanel(){
    return this
      .dashboard
      .value
      .data
      ?.panels
      .find( p => p.id == this.panelId );
  }

  constructor(
    private dbService: DashboardService,
    private userService: UserService,
    private router: Router,
    private activeRoute: ActivatedRoute ){
      console.log( 'created DashboardStore' );

      this.analyzeRoute()
    }

  private analyzeRoute(){
    this
      .router
      .events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        map(() => this.activeRoute),
        map(route => {
          let uid: string;
          let existing: boolean;
          let panel: number;

          while (route.firstChild ) {
            route = route.firstChild;

            uid = uid ?? route.snapshot.params[ "uid" ];
            existing = existing ?? route.snapshot.data.existing;
            const p = +route.snapshot.params['panelId'];

            if( Number.isInteger( p ) ){
              panel = p;
            }
          }

          return {
            uid, existing, panel
          };
        }))
      .subscribe( x => {
        const { uid, panel, existing } = x;

        if( existing === undefined ){
          this.clear();
        } else { 
          this.loadDashboard(uid, existing, panel);
        } 
      } );
  }

  private clear(){
    if( this.dashboard.getValue() ){
      console.log( "dashboard store cleared" );
      this.uid = undefined;
      this.existing = undefined;
      this.panelId = undefined;
      this.dashboard.next( undefined );
      //this._time.next( undefined );
    }
  }

  private loadDashboard(uid: string, existing: boolean, panelId: number = undefined) {
    const sameActivity = ( existing == this.existing );

    this.uid = uid;
    this.existing = existing;
    this.panelId = panelId;

    this.panel.next( undefined );

    const fetchedDashboard = this.dashboard.value;

    if( !uid ){
      if( fetchedDashboard && sameActivity ){
        console.log( `store gets new dashboard from cache` );
        //this._dashboard.next( DashboardResult.success( existing, this.panel ) )
        this.dashboard.next( fetchedDashboard )
        this.panel.next( this.selectedPanel );
      } else {
        console.log( "create empty dashboard" )
        // const d = new Dashboard();
        // d.title = "New dashboard";
        // this._dashboard.next( DashboardResult.success( d, this.panel ) );
        // this.timeManager.update( d.time, false );
        //console.log( d );
      }
    } else {
      if( uid == fetchedDashboard?.uid ){
        //console.log( `store gets [${uid}] dashboard from cache` );
        this.panel.next( this.selectedPanel );
        //this._dashboard.next( DashboardResult.success( existing, this.panel ) )
        //this.dashboard.next( fetchedDashboard )
      } else {
        console.log( `store loads [${uid}] dashboard from server` )
        //this._dashboard.next( undefined );

        this.error.next( null );

        this
          .dbService
          .getDashboard(this.uid)
          .subscribe(
            x => {
              // const panel = x.panels.find( p => p.id == this.panelId );
              this.dashboard.next( x )
              this.panel.next( this.selectedPanel );
              // this.timeManager.update( x.time, false );
              // this.updateAllPanelsAlertState();
            },
            e => {
              this.error.next( e );
              this.dashboard.next( null )
            } );
      }
    }
  }

}