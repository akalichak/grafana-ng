import { Injectable } from '@angular/core';
import { NavigationItem } from '../models/nav';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class SideMenuService{
  private _visible: boolean = true;
  private _opened: boolean = false;

  private _visibleState: BehaviorSubject<boolean> = new BehaviorSubject(this._visible);
  public readonly visible$: Observable<boolean> = this._visibleState.asObservable();

  private _openedState: BehaviorSubject<boolean> = new BehaviorSubject(this._opened);
  public readonly opened$: Observable<boolean> = this._openedState.asObservable();

  get visible() : boolean {
    return this._visible;
  }

  get opened(){
    return this._opened;
  }

  get items (): NavigationItem[]{
    return [
      this.getCreateItem(),
      this.getDashboardsItem(),
      this.getAlertItem(),
      this.getConfigItem()
    ];
  }

  constructor( /*Auth service will be here */){
  
  }

  toggle(){
    this._visible = !this._visible;

    this._visibleState.next( this._visible );
  }

  toggleMobile(){
    this._opened = !this._opened;

    this._openedState.next( this._opened );
  }

  private getCreateItem() : NavigationItem {
    return {
      text: "Create",
      icon: "plus",

      children: [
        {
          text:"Dashboard",
          url:"/d/new",
          img: "gicon-dashboard-new"
        },
        {
          text:"Folder",
          url:"dashboards/f/new",
          img: "gicon-folder-new "
        },
        {
          text:"Import",
          url:"snapshots",
          img: "gicon-dashboard-import"
        }
      ]


    }
  }

  private getDashboardsItem() : NavigationItem {
    return {
      text: "Dashboards",
      subTitle: "Manage dashboards & folders",
      img: "gicon-dashboard",

      children: [
        {
          id: "manage-dashboards",
          text: "Dashboards",
          url:"dashboards",
          icon: "sidebar__icon-manage"
        },
        {
          text:"Playlists",
          url:"dashboards/playlists",
          icon: "sidebar__icon-playlist"
        },
        {
          text:"Snapshots",
          url:"dashboards/snapshots",
          icon: "sidebar__icon-snapshots"
        }
      ]


    }
  }

  private getAlertItem() : NavigationItem {
    return {
      text: "Alerting",
      subTitle: "Alert rules & notifications",
      img: "gicon-alert",

      children: [
        {
          id: "manage-dashboards",
          text: "Alert Rules",
          url:"alerting/list",
          img: "gicon-alert-rules"
        },
        {
          text:"Notification Channels",
          url:"alerting/notifications",
          img: "gicon-playlists" 
        }
      ]


    }
  }

  private getConfigItem() : NavigationItem {
    return {
      text: "Configuration",
      img: "gicon-cog",

      children: [
        {
          text: "Data Sourcess",
          url:"datasources",
        }
      ]


    }
  }
}