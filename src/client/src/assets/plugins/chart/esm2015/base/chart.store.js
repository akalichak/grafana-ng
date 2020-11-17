import { Inject, Injectable } from '@angular/core';
import { PANEL_TOKEN } from 'common';
import { BehaviorSubject } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "common";
import * as i2 from "../data/data-provider";
import * as i3 from "../view/display-manager";
import * as i4 from "./mouse.store";
export class ChartStore {
    constructor(dashboardStore, dataProvider, display, annotationStore, mouse, panel) {
        this.dashboardStore = dashboardStore;
        this.dataProvider = dataProvider;
        this.display = display;
        this.annotationStore = annotationStore;
        this.mouse = mouse;
        this.panel = panel;
        this.data = new BehaviorSubject(null);
        this.data$ = this.data.asObservable();
        dataProvider
            .data$
            .subscribe(x => { var _a; return this.data.next((_a = x === null || x === void 0 ? void 0 : x.datasets) !== null && _a !== void 0 ? _a : []); });
        this.dashboardSubs = dashboardStore
            .dashboard$
            .subscribe(x => this.dashboard = x);
        this.annotSubs = annotationStore
            .annotationsUpdate$
            .subscribe(_ => this.refresh());
    }
    get widget() {
        return this.panel.widget;
    }
    destroy() {
        var _a, _b;
        (_a = this.dashboardSubs) === null || _a === void 0 ? void 0 : _a.unsubscribe();
        (_b = this.annotSubs) === null || _b === void 0 ? void 0 : _b.unsubscribe();
        this.dataProvider.destroy();
        this.widget.component = undefined;
    }
    refresh() {
        var _a, _b;
        (_b = (_a = this
            .widget
            .component) === null || _a === void 0 ? void 0 : _a.control) === null || _b === void 0 ? void 0 : _b.refresh();
    }
}
ChartStore.ɵfac = function ChartStore_Factory(t) { return new (t || ChartStore)(i0.ɵɵinject(i1.DashboardStore), i0.ɵɵinject(i2.DataProvider), i0.ɵɵinject(i3.DisplayManager), i0.ɵɵinject(i1.AnnotationStore), i0.ɵɵinject(i4.MouseStore), i0.ɵɵinject(PANEL_TOKEN)); };
ChartStore.ɵprov = i0.ɵɵdefineInjectable({ token: ChartStore, factory: ChartStore.ɵfac });
/*@__PURE__*/ (function () { i0.ɵsetClassMetadata(ChartStore, [{
        type: Injectable
    }], function () { return [{ type: i1.DashboardStore }, { type: i2.DataProvider }, { type: i3.DisplayManager }, { type: i1.AnnotationStore }, { type: i4.MouseStore }, { type: undefined, decorators: [{
                type: Inject,
                args: [PANEL_TOKEN]
            }] }]; }, null); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcnQuc3RvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9hcHAvcGx1Z2lucy93aWRnZXRzL2NoYXJ0L3NyYy9iYXNlL2NoYXJ0LnN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ25ELE9BQU8sRUFBeUIsV0FBVyxFQUE4QixNQUFNLFFBQVEsQ0FBQztBQUN4RixPQUFPLEVBQUUsZUFBZSxFQUE0QixNQUFNLE1BQU0sQ0FBQzs7Ozs7O0FBUWpFLE1BQU0sT0FBTyxVQUFVO0lBYXRCLFlBQ1MsY0FBOEIsRUFDL0IsWUFBMEIsRUFDMUIsT0FBdUIsRUFDdkIsZUFBZ0MsRUFDaEMsS0FBaUIsRUFDTSxLQUFZO1FBTGxDLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtRQUMvQixpQkFBWSxHQUFaLFlBQVksQ0FBYztRQUMxQixZQUFPLEdBQVAsT0FBTyxDQUFnQjtRQUN2QixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFDaEMsVUFBSyxHQUFMLEtBQUssQ0FBWTtRQUNNLFVBQUssR0FBTCxLQUFLLENBQU87UUFsQm5DLFNBQUksR0FBK0IsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUQsVUFBSyxHQUEwQixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBbUIvRCxZQUFZO2FBQ1YsS0FBSzthQUNMLFNBQVMsQ0FBRSxDQUFDLENBQUMsRUFBRSxXQUFDLE9BQUEsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLE9BQUUsQ0FBQyxhQUFELENBQUMsdUJBQUQsQ0FBQyxDQUFFLFFBQVEsbUNBQUksRUFBRSxDQUFFLENBQUEsRUFBQSxDQUFFLENBQUM7UUFFeEQsSUFBSSxDQUFDLGFBQWEsR0FBRyxjQUFjO2FBQ2pDLFVBQVU7YUFDVixTQUFTLENBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBRSxDQUFDO1FBRXZDLElBQUksQ0FBQyxTQUFTLEdBQUcsZUFBZTthQUM5QixrQkFBa0I7YUFDbEIsU0FBUyxDQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFFLENBQUM7SUFDckMsQ0FBQztJQXZCRCxJQUFJLE1BQU07UUFDVCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQzFCLENBQUM7SUF1QkQsT0FBTzs7UUFDTixNQUFBLElBQUksQ0FBQyxhQUFhLDBDQUFFLFdBQVcsR0FBRztRQUNsQyxNQUFBLElBQUksQ0FBQyxTQUFTLDBDQUFFLFdBQVcsR0FBRztRQUM5QixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztJQUNuQyxDQUFDO0lBRUQsT0FBTzs7UUFDSixZQUFBLElBQUk7YUFDRCxNQUFNO2FBQ04sU0FBUywwQ0FDUixPQUFPLDBDQUNQLE9BQU8sR0FBRztJQUNoQixDQUFDOztvRUEvQ1UsVUFBVSx5S0FtQlosV0FBVztrREFuQlQsVUFBVSxXQUFWLFVBQVU7a0RBQVYsVUFBVTtjQUR0QixVQUFVOztzQkFvQlIsTUFBTTt1QkFBRSxXQUFXIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0LCBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBEYXNoYm9hcmRTdG9yZSwgUGFuZWwsIFBBTkVMX1RPS0VOLCBBbm5vdGF0aW9uU3RvcmUsIERhc2hib2FyZCB9IGZyb20gJ2NvbW1vbic7XG5pbXBvcnQgeyBCZWhhdmlvclN1YmplY3QsIE9ic2VydmFibGUsIFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQgeyBDaGFydCwgRGF0YVNldCB9IGZyb20gJy4uL2NoYXJ0Lm0nO1xuaW1wb3J0IHsgRGF0YVByb3ZpZGVyIH0gZnJvbSAnLi4vZGF0YS9kYXRhLXByb3ZpZGVyJztcbmltcG9ydCB7IERpc3BsYXlNYW5hZ2VyIH0gZnJvbSAnLi4vdmlldy9kaXNwbGF5LW1hbmFnZXInO1xuaW1wb3J0IHsgTW91c2VTdG9yZSB9IGZyb20gJy4vbW91c2Uuc3RvcmUnO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgQ2hhcnRTdG9yZSB7XG5cdHByaXZhdGUgZGF0YTogQmVoYXZpb3JTdWJqZWN0PERhdGFTZXRbXT4gPSBuZXcgQmVoYXZpb3JTdWJqZWN0KG51bGwpO1xuXHRyZWFkb25seSBkYXRhJDogT2JzZXJ2YWJsZTxEYXRhU2V0W10+ID0gdGhpcy5kYXRhLmFzT2JzZXJ2YWJsZSgpO1xuXG5cdGRhc2hib2FyZDogRGFzaGJvYXJkO1xuXHRcblx0cHJpdmF0ZSBkYXNoYm9hcmRTdWJzOiBTdWJzY3JpcHRpb247XG5cdHByaXZhdGUgYW5ub3RTdWJzOiBTdWJzY3JpcHRpb247XG5cblx0Z2V0IHdpZGdldCgpOiBDaGFydHtcblx0XHRyZXR1cm4gdGhpcy5wYW5lbC53aWRnZXQ7XG5cdH1cblxuXHRjb25zdHJ1Y3RvciggXG5cdFx0cHJpdmF0ZSBkYXNoYm9hcmRTdG9yZTogRGFzaGJvYXJkU3RvcmUsXG5cdFx0cHVibGljIGRhdGFQcm92aWRlcjogRGF0YVByb3ZpZGVyLFxuXHRcdHB1YmxpYyBkaXNwbGF5OiBEaXNwbGF5TWFuYWdlcixcblx0XHRwdWJsaWMgYW5ub3RhdGlvblN0b3JlOiBBbm5vdGF0aW9uU3RvcmUsXG5cdFx0cHVibGljIG1vdXNlOiBNb3VzZVN0b3JlLFxuXHRcdEBJbmplY3QoIFBBTkVMX1RPS0VOICkgcHVibGljIHBhbmVsOiBQYW5lbCApe1xuXG5cdFx0XHRkYXRhUHJvdmlkZXJcblx0XHRcdFx0LmRhdGEkXG5cdFx0XHRcdC5zdWJzY3JpYmUoIHggPT4gdGhpcy5kYXRhLm5leHQoIHg/LmRhdGFzZXRzID8/IFtdICkgKTtcblxuXHRcdFx0dGhpcy5kYXNoYm9hcmRTdWJzID0gZGFzaGJvYXJkU3RvcmVcblx0XHRcdFx0LmRhc2hib2FyZCRcblx0XHRcdFx0LnN1YnNjcmliZSggeCA9PiB0aGlzLmRhc2hib2FyZCA9IHggKTtcblxuXHRcdFx0dGhpcy5hbm5vdFN1YnMgPSBhbm5vdGF0aW9uU3RvcmVcblx0XHRcdFx0LmFubm90YXRpb25zVXBkYXRlJFxuXHRcdFx0XHQuc3Vic2NyaWJlKCBfID0+IHRoaXMucmVmcmVzaCgpICk7XG5cdH1cblxuXHRkZXN0cm95KCl7XG5cdFx0dGhpcy5kYXNoYm9hcmRTdWJzPy51bnN1YnNjcmliZSgpO1xuXHRcdHRoaXMuYW5ub3RTdWJzPy51bnN1YnNjcmliZSgpO1xuXHRcdHRoaXMuZGF0YVByb3ZpZGVyLmRlc3Ryb3koKTtcblx0XHR0aGlzLndpZGdldC5jb21wb25lbnQgPSB1bmRlZmluZWQ7XG5cdH1cblxuXHRyZWZyZXNoKCl7XG4gICAgdGhpc1xuICAgICAgLndpZGdldFxuICAgICAgLmNvbXBvbmVudFxuICAgICAgPy5jb250cm9sXG4gICAgICA/LnJlZnJlc2goKTtcbiAgfVxufVxuIl19