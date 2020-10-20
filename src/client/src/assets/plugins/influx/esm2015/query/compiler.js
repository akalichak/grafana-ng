import { Component } from '@angular/core';
import { TimeRangeParser } from 'common';
import { AggrFuncGroup, AggrFuncHelper, OrderByTime, GroupByOption, MetricVars } from './query.m';
import * as _ from 'lodash';
import { of } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "common";
export class InfluxQueryCompiler {
    constructor(time) {
        this.time = time;
    }
    compile(query, range) {
        //console.log( query );
        const array = [];
        query
            .targets
            .forEach(t => {
            // const modifiedRange = this
            // 	.timeManager
            // 	.getModifiedRange( this.widget.time )
            const gen = new Compiler(this.time, t, range);
            if (!gen.invalid && !t.virgin) {
                array.push(gen.text);
            }
        });
        let request = array.join(';');
        return of(request);
    }
}
InfluxQueryCompiler.ɵfac = function InfluxQueryCompiler_Factory(t) { return new (t || InfluxQueryCompiler)(i0.ɵɵdirectiveInject(i1.TimeRangeStore)); };
InfluxQueryCompiler.ɵcmp = i0.ɵɵdefineComponent({ type: InfluxQueryCompiler, selectors: [["query-compiler"]], decls: 0, vars: 0, template: function InfluxQueryCompiler_Template(rf, ctx) { }, encapsulation: 2 });
/*@__PURE__*/ (function () { i0.ɵsetClassMetadata(InfluxQueryCompiler, [{
        type: Component,
        args: [{
                selector: 'query-compiler',
                template: ''
            }]
    }], function () { return [{ type: i1.TimeRangeStore }]; }, null); })();
class Compiler {
    constructor(time, target, range) {
        this.time = time;
        this.target = target;
        this.range = range;
    }
    get invalid() {
        const invalidQuery = (!this.target) ||
            (!this.target.fields || 0 === this.target.fields.length);
        return invalidQuery;
    }
    get text() {
        return `SELECT ${this.getFieldsText()} FROM ${this.getMeasurementText()}`;
    }
    getFieldsText() {
        let result = '';
        if (!this.target.fields) {
            return result;
        }
        this.target.fields.forEach(x => {
            if (result.length > 0) {
                result += ', ';
            }
            result += this.getFieldText(x);
        });
        return result;
    }
    getFieldText(field) {
        let result = '';
        let key = (!field.key) ? 'field' : field.key;
        const aggr = field.functions.find(x => AggrFuncHelper.getGroup(x.name) == AggrFuncGroup.Aggregations ||
            AggrFuncHelper.getGroup(x.name) == AggrFuncGroup.Selectors);
        if (aggr) {
            result += aggr.name + ((aggr.param && aggr.param.value) ?
                `("${key}", ${aggr.param.value})` : `("${key}")`);
        }
        else {
            result = `"${key}"`;
        }
        const trans = field.functions.filter(x => AggrFuncHelper.getGroup(x.name) === AggrFuncGroup.Transformations);
        trans.forEach(x => {
            const p = (x.param && x.param.value) ? `, ${x.param.value}` : ``;
            result = `${x.name}(${result}${p})`;
        });
        const math = field.functions.find(x => AggrFuncHelper.getGroup(x.name) === AggrFuncGroup.Math);
        if (math) {
            result = `${result} ${math.param.value}`;
        }
        const alias = field.functions.find(x => AggrFuncHelper.getGroup(x.name) === AggrFuncGroup.Alias);
        if (alias) {
            result = `${result} AS "${alias.param.value}"`;
        }
        return result;
    }
    getMeasurementText() {
        const meas = (!this.target.measurement) ? 'measurement' : this.target.measurement;
        let rp = (this.target.policy && this.target.policy.length > 0 && this.target.policy !== 'default') ?
            `"${this.target.policy}".` : '';
        let root = `${rp}"${meas}"`;
        let cond = '';
        let tagIndex = 0;
        if (this.target.tags) {
            this
                .target
                .tags
                .filter(x => x.key && x.value)
                .forEach(x => {
                if (tagIndex > 0) {
                    cond += ` ${x.condition} `;
                }
                cond += ` "${x.key}" ${x.operator} '${x.value}'`;
                ++tagIndex;
            });
        }
        const timeFilter = (this.range) ?
            this.getTimeFilter() : MetricVars.TIME_FILTER;
        if (cond.length > 0) {
            root = `${root} WHERE (${cond}) and ${timeFilter}`;
        }
        else {
            // TODO
            root = `${root} WHERE ${timeFilter}`;
        }
        const groupBy = this.target.groupBy;
        const groupByTime = groupBy.find(x => x.type == GroupByOption.Time);
        const groupByFill = groupBy.find(x => x.type == GroupByOption.Fill);
        const groupByTag = groupBy.filter(x => x.type == GroupByOption.Tag);
        if (groupByTime) {
            const gb = (this.range) ? this.getOptimalAutoGroupBy() : groupByTime.params[0];
            root = `${root} GROUP BY time(${gb})`;
        }
        if (groupByTag.length > 0) {
            root = (!groupByTime) ? `${root} GROUP BY` : `${root},`;
            groupByTag.forEach((e, index) => {
                root = `${root}${index > 0 ? ', ' : ' '} "${e.params[0]}"`;
            });
        }
        if (groupByFill) {
            root = `${root} FILL(${groupByFill.params[0]})`;
        }
        if (this.target.order != OrderByTime.Asc) {
            root = `${root} ORDER BY time DESC`;
        }
        if (this.target.limit > 0) {
            root = `${root} LIMIT ${this.target.limit}`;
        }
        if (this.target.slimit > 0) {
            root = `${root} SLIMIT ${this.target.slimit}`;
        }
        return root;
    }
    getOptimalAutoGroupBy() {
        const f = TimeRangeParser.toDateTime(this.range.from, false);
        const t = TimeRangeParser.toDateTime(this.range.to, true);
        if (5 > +t.diff(f, "minutes"))
            return "200ms";
        if (15 > +t.diff(f, "minutes"))
            return "1s";
        if (30 > t.diff(f, "minutes"))
            return "2s";
        if (1 > t.diff(f, "hours"))
            return "5s";
        if (3 > t.diff(f, "hours"))
            return "10s";
        if (6 > t.diff(f, "hours"))
            return "20s";
        if (12 > t.diff(f, "hours"))
            return "1m";
        if (24 > t.diff(f, "hours"))
            return "2m";
        if (7 > t.diff(f, "days"))
            return "10m";
        if (31 > t.diff(f, "days"))
            return "1h";
        if (365 > t.diff(f, "days"))
            return "12h";
        return "24h";
    }
    getTimeFilter() {
        const range = this.range;
        const tz = this.time.converter.timezone; //this.range.timezone;
        let from = this.getInfluxTime(range.from, false, tz);
        let to = this.getInfluxTime(range.to, true, tz);
        const fromIsAbsolute = from[from.length - 1] === 'ms';
        if (to === 'now()' && !fromIsAbsolute) {
            return 'time >= ' + from;
        }
        return 'time >= ' + from + ' and time <= ' + to;
    }
    getInfluxTime(date, roundUp, timezone) {
        if (_.isString(date)) {
            if (date === 'now') {
                return 'now()';
            }
            const parts = /^now-(\d+)([dhms])$/.exec(date);
            if (parts) {
                const amount = parseInt(parts[1], 10);
                const unit = parts[2];
                return 'now() - ' + amount + unit;
            }
            date = TimeRangeParser.toDateTime(date, roundUp, timezone);
        }
        return date.valueOf() + 'ms';
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9hcHAvcGx1Z2lucy9kYXRhc291cmNlcy9pbmZsdXgvc3JjL3F1ZXJ5L2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDMUMsT0FBTyxFQUFhLGVBQWUsRUFBMkMsTUFBTSxRQUFRLENBQUM7QUFDN0YsT0FBTyxFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQzlCLFdBQVcsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ2xFLE9BQU8sS0FBSyxDQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzVCLE9BQU8sRUFBYyxFQUFFLEVBQUUsTUFBTSxNQUFNLENBQUM7OztBQU10QyxNQUFNLE9BQU8sbUJBQW1CO0lBRS9CLFlBQXFCLElBQW9CO1FBQXBCLFNBQUksR0FBSixJQUFJLENBQWdCO0lBRXpDLENBQUM7SUFHRCxPQUFPLENBQUUsS0FBVSxFQUFFLEtBQWlCO1FBQ3JDLHVCQUF1QjtRQUV2QixNQUFNLEtBQUssR0FBRyxFQUFFLENBQUM7UUFFakIsS0FBSzthQUNILE9BQU87YUFDUCxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDWiw2QkFBNkI7WUFDN0IsZ0JBQWdCO1lBQ2hCLHlDQUF5QztZQUV6QyxNQUFNLEdBQUcsR0FBRyxJQUFJLFFBQVEsQ0FBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUUsQ0FBQztZQUVoRCxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUU7Z0JBQzlCLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3JCO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSixJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFD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QUFTLENBQUU7WUFDL0IsT0FBTyxJQUFJLENBQUM7UUFFYixJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFFLENBQUMsRUFBRSxTQUFTLENBQUU7WUFDOUIsT0FBTyxJQUFJLENBQUM7UUFFYixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFFLENBQUMsRUFBRSxPQUFPLENBQUU7WUFDM0IsT0FBTyxJQUFJLENBQUM7UUFFYixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFFLENBQUMsRUFBRSxPQUFPLENBQUU7WUFDM0IsT0FBTyxLQUFLLENBQUM7UUFFZCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFFLENBQUMsRUFBRSxPQUFPLENBQUU7WUFDM0IsT0FBTyxLQUFLLENBQUM7UUFFZCxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFFLENBQUMsRUFBRSxPQUFPLENBQUU7WUFDNUIsT0FBTyxJQUFJLENBQUM7UUFFYixJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFFLENBQUMsRUFBRSxPQUFPLENBQUU7WUFDNUIsT0FBTyxJQUFJLENBQUM7UUFFYixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFFLENBQUMsRUFBRSxNQUFNLENBQUU7WUFDMUIsT0FBTyxLQUFLLENBQUM7UUFFZCxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFFLENBQUMsRUFBRSxNQUFNLENBQUU7WUFDM0IsT0FBTyxJQUFJLENBQUM7UUFFYixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFFLENBQUMsRUFBRSxNQUFNLENBQUU7WUFDNUIsT0FBTyxLQUFLLENBQUM7UUFFYixPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFQSxhQUFhO1FBQ1gsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUN6QixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxzQkFBc0I7UUFFL0QsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN0RCxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQztRQUV0RCxJQUFJLEVBQUUsS0FBSyxPQUFPLElBQUksQ0FBQyxjQUFjLEVBQUU7WUFDckMsT0FBTyxVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQzFCO1FBRUQsT0FBTyxVQUFVLEdBQUcsSUFBSSxHQUFHLGVBQWUsR0FBRyxFQUFFLENBQUM7SUFDbkQsQ0FBQztJQUVBLGFBQWEsQ0FBQyxJQUFTLEVBQUUsT0FBWSxFQUFFLFFBQWtCO1FBQ3ZELElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNwQixJQUFJLElBQUksS0FBSyxLQUFLLEVBQUU7Z0JBQ2xCLE9BQU8sT0FBTyxDQUFDO2FBQ2hCO1lBRUQsTUFBTSxLQUFLLEdBQUcscUJBQXFCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRS9DLElBQUksS0FBSyxFQUFFO2dCQUNULE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3RDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEIsT0FBTyxVQUFVLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQzthQUNuQztZQUVELElBQUksR0FBRyxlQUFlLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDNUQ7UUFFRCxPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUM7SUFDL0IsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBUaW1lUmFuZ2UsIFRpbWVSYW5nZVBhcnNlciwgVGltZVJhbmdlU3RvcmUsIFRpbWV6b25lLCBRdWVyeUNvbXBpbGVyIH0gZnJvbSAnY29tbW9uJztcbmltcG9ydCB7IEFnZ3JGdW5jR3JvdXAsIEFnZ3JGdW5jSGVscGVyLFxuXHRGaWVsZCwgT3JkZXJCeVRpbWUsIEdyb3VwQnlPcHRpb24sIE1ldHJpY1ZhcnMgfSBmcm9tICcuL3F1ZXJ5Lm0nO1xuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgb2YgfSBmcm9tICdyeGpzJztcblxuQENvbXBvbmVudCh7XG5cdHNlbGVjdG9yOiAncXVlcnktY29tcGlsZXInLFxuXHR0ZW1wbGF0ZTogJydcbn0pXG5leHBvcnQgY2xhc3MgSW5mbHV4UXVlcnlDb21waWxlciBpbXBsZW1lbnRzIFF1ZXJ5Q29tcGlsZXIge1xuXG5cdGNvbnN0cnVjdG9yKCBwcml2YXRlIHRpbWU6IFRpbWVSYW5nZVN0b3JlICl7XG5cdFx0XG5cdH1cblxuXG5cdGNvbXBpbGUoIHF1ZXJ5OiBhbnksIHJhbmdlPzogVGltZVJhbmdlICkgOiBPYnNlcnZhYmxlPHN0cmluZz4ge1xuXHRcdC8vY29uc29sZS5sb2coIHF1ZXJ5ICk7XG5cblx0XHRjb25zdCBhcnJheSA9IFtdO1xuXG5cdFx0cXVlcnlcblx0XHRcdC50YXJnZXRzXG5cdFx0XHQuZm9yRWFjaCh0ID0+IHtcblx0XHRcdFx0Ly8gY29uc3QgbW9kaWZpZWRSYW5nZSA9IHRoaXNcblx0XHRcdFx0Ly8gXHQudGltZU1hbmFnZXJcblx0XHRcdFx0Ly8gXHQuZ2V0TW9kaWZpZWRSYW5nZSggdGhpcy53aWRnZXQudGltZSApXG5cblx0XHRcdFx0Y29uc3QgZ2VuID0gbmV3IENvbXBpbGVyKCB0aGlzLnRpbWUsIHQsIHJhbmdlICk7XG5cblx0XHRcdFx0aWYgKCFnZW4uaW52YWxpZCAmJiAhdC52aXJnaW4pIHtcblx0XHRcdFx0XHRhcnJheS5wdXNoKGdlbi50ZXh0KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRsZXQgcmVxdWVzdCA9IGFycmF5LmpvaW4oJzsnKTtcblxuXHRcdHJldHVybiBvZiggcmVxdWVzdCApO1xuXHR9XG59XG5cbmNsYXNzIENvbXBpbGVye1xuXHRnZXQgaW52YWxpZCgpe1xuICAgIGNvbnN0IGludmFsaWRRdWVyeSA9IFxuICAgICAgKCF0aGlzLnRhcmdldCkgfHxcbiAgICAgICghdGhpcy50YXJnZXQuZmllbGRzIHx8IDAgPT09IHRoaXMudGFyZ2V0LmZpZWxkcy5sZW5ndGggKTtcblxuICAgIHJldHVybiBpbnZhbGlkUXVlcnk7XG5cdH1cblx0XG5cdGdldCB0ZXh0KCkge1xuICAgIHJldHVybiBgU0VMRUNUICR7dGhpcy5nZXRGaWVsZHNUZXh0KCl9IEZST00gJHt0aGlzLmdldE1lYXN1cmVtZW50VGV4dCgpfWBcbiAgfVxuXG5cdGNvbnN0cnVjdG9yKCBcblx0XHRwcml2YXRlIHRpbWU6IFRpbWVSYW5nZVN0b3JlLFxuXHRcdHByaXZhdGUgdGFyZ2V0OiBhbnksXG5cdFx0cHJpdmF0ZSByYW5nZT86IFRpbWVSYW5nZSApe1xuXG5cdH1cblxuXHRnZXRGaWVsZHNUZXh0KCkge1xuXHRcdGxldCByZXN1bHQgPSAnJztcblx0XHRcbiAgICBpZiAoIXRoaXMudGFyZ2V0LmZpZWxkcykge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICB0aGlzLnRhcmdldC5maWVsZHMuZm9yRWFjaCh4ID0+IHtcbiAgICAgIGlmIChyZXN1bHQubGVuZ3RoID4gMCkge1xuICAgICAgICByZXN1bHQgKz0gJywgJztcbiAgICAgIH1cblxuICAgICAgcmVzdWx0ICs9IHRoaXMuZ2V0RmllbGRUZXh0KCB4ICk7XG4gICAgfSlcblxuICAgIHJldHVybiByZXN1bHQ7XG5cdH1cblx0XG5cdFxuICBnZXRGaWVsZFRleHQoZmllbGQ6IEZpZWxkKSB7XG5cdFx0IGxldCByZXN1bHQgPSAnJztcbiAgICBsZXQga2V5ID0gKCFmaWVsZC5rZXkpID8gJ2ZpZWxkJyA6IGZpZWxkLmtleTtcblxuICAgIGNvbnN0IGFnZ3IgPSBmaWVsZC5mdW5jdGlvbnMuZmluZCh4ID0+XG4gICAgICBBZ2dyRnVuY0hlbHBlci5nZXRHcm91cCh4Lm5hbWUpID09IEFnZ3JGdW5jR3JvdXAuQWdncmVnYXRpb25zIHx8XG4gICAgICBBZ2dyRnVuY0hlbHBlci5nZXRHcm91cCh4Lm5hbWUpID09IEFnZ3JGdW5jR3JvdXAuU2VsZWN0b3JzKTtcblxuICAgIGlmIChhZ2dyKSB7XG4gICAgICByZXN1bHQgKz0gYWdnci5uYW1lICsgKChhZ2dyLnBhcmFtICYmIGFnZ3IucGFyYW0udmFsdWUpID9cbiAgICAgICAgYChcIiR7a2V5fVwiLCAke2FnZ3IucGFyYW0udmFsdWV9KWAgOiBgKFwiJHtrZXl9XCIpYCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9IGBcIiR7a2V5fVwiYDtcbiAgICB9XG5cbiAgICBjb25zdCB0cmFucyA9IGZpZWxkLmZ1bmN0aW9ucy5maWx0ZXIoeCA9PlxuICAgICAgQWdnckZ1bmNIZWxwZXIuZ2V0R3JvdXAoeC5uYW1lKSA9PT0gQWdnckZ1bmNHcm91cC5UcmFuc2Zvcm1hdGlvbnMpO1xuXG4gICAgdHJhbnMuZm9yRWFjaCh4ID0+IHtcbiAgICAgIGNvbnN0IHAgPSAoeC5wYXJhbSAmJiB4LnBhcmFtLnZhbHVlKSA/IGAsICR7eC5wYXJhbS52YWx1ZX1gIDogYGA7XG4gICAgICByZXN1bHQgPSBgJHt4Lm5hbWV9KCR7cmVzdWx0fSR7cH0pYDtcbiAgICB9KVxuXG4gICAgY29uc3QgbWF0aCA9IGZpZWxkLmZ1bmN0aW9ucy5maW5kKHggPT5cbiAgICAgIEFnZ3JGdW5jSGVscGVyLmdldEdyb3VwKHgubmFtZSkgPT09IEFnZ3JGdW5jR3JvdXAuTWF0aCk7XG5cbiAgICBpZiAobWF0aCkge1xuICAgICAgcmVzdWx0ID0gYCR7cmVzdWx0fSAke21hdGgucGFyYW0udmFsdWV9YDtcbiAgICB9XG5cbiAgICBjb25zdCBhbGlhcyA9IGZpZWxkLmZ1bmN0aW9ucy5maW5kKHggPT5cbiAgICAgIEFnZ3JGdW5jSGVscGVyLmdldEdyb3VwKHgubmFtZSkgPT09IEFnZ3JGdW5jR3JvdXAuQWxpYXMpO1xuXG4gICAgaWYgKGFsaWFzKSB7XG4gICAgICByZXN1bHQgPSBgJHtyZXN1bHR9IEFTIFwiJHthbGlhcy5wYXJhbS52YWx1ZX1cImA7XG4gICAgfVxuXG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXHRcbiAgZ2V0TWVhc3VyZW1lbnRUZXh0KCkge1xuICAgIGNvbnN0IG1lYXMgPSAoIXRoaXMudGFyZ2V0Lm1lYXN1cmVtZW50KSA/ICdtZWFzdXJlbWVudCcgOiB0aGlzLnRhcmdldC5tZWFzdXJlbWVudDtcblxuICAgIGxldCBycCA9ICh0aGlzLnRhcmdldC5wb2xpY3kgJiYgdGhpcy50YXJnZXQucG9saWN5Lmxlbmd0aCA+IDAgJiYgdGhpcy50YXJnZXQucG9saWN5ICE9PSAnZGVmYXVsdCcpID9cbiAgICAgIGBcIiR7dGhpcy50YXJnZXQucG9saWN5fVwiLmAgOiAnJztcblxuICAgIGxldCByb290ID0gYCR7cnB9XCIke21lYXN9XCJgO1xuICAgIGxldCBjb25kID0gJyc7XG5cbiAgICBsZXQgdGFnSW5kZXggPSAwO1xuXG4gICAgaWYgKHRoaXMudGFyZ2V0LnRhZ3MpIHtcbiAgICAgIHRoaXNcbiAgICAgICAgLnRhcmdldFxuICAgICAgICAudGFnc1xuICAgICAgICAuZmlsdGVyKHggPT4geC5rZXkgJiYgeC52YWx1ZSlcbiAgICAgICAgLmZvckVhY2goeCA9PiB7XG4gICAgICAgICAgaWYgKHRhZ0luZGV4ID4gMCkge1xuICAgICAgICAgICAgY29uZCArPSBgICR7eC5jb25kaXRpb259IGA7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uZCArPSBgIFwiJHt4LmtleX1cIiAke3gub3BlcmF0b3J9ICcke3gudmFsdWV9J2A7XG4gICAgICAgICAgKyt0YWdJbmRleDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgdGltZUZpbHRlciA9ICggdGhpcy5yYW5nZSApID9cbiAgICAgIHRoaXMuZ2V0VGltZUZpbHRlcigpIDogTWV0cmljVmFycy5USU1FX0ZJTFRFUjtcblxuICAgIGlmIChjb25kLmxlbmd0aCA+IDApIHtcbiAgICAgIHJvb3QgPSBgJHtyb290fSBXSEVSRSAoJHtjb25kfSkgYW5kICR7dGltZUZpbHRlcn1gXG4gICAgfVxuICAgIGVsc2V7XG4gICAgICAvLyBUT0RPXG4gICAgICByb290ID0gYCR7cm9vdH0gV0hFUkUgJHt0aW1lRmlsdGVyfWBcblx0XHR9XG5cblx0XHRjb25zdCBncm91cEJ5ID0gdGhpcy50YXJnZXQuZ3JvdXBCeTtcblx0XHRjb25zdCBncm91cEJ5VGltZSA9IGdyb3VwQnkuZmluZCggeCA9PiB4LnR5cGUgPT0gR3JvdXBCeU9wdGlvbi5UaW1lICk7XG5cdFx0Y29uc3QgZ3JvdXBCeUZpbGwgPSBncm91cEJ5LmZpbmQoIHggPT4geC50eXBlID09IEdyb3VwQnlPcHRpb24uRmlsbCApO1xuXHRcdGNvbnN0IGdyb3VwQnlUYWcgPSBncm91cEJ5LmZpbHRlciggeCA9PiB4LnR5cGUgPT0gR3JvdXBCeU9wdGlvbi5UYWcgKTtcblxuXHRcdGlmKCBncm91cEJ5VGltZSApe1xuICAgICAgY29uc3QgZ2IgPSAoIHRoaXMucmFuZ2UgKSA/IHRoaXMuZ2V0T3B0aW1hbEF1dG9Hcm91cEJ5KCkgOiBncm91cEJ5VGltZS5wYXJhbXNbIDAgXTtcblx0XHRcdHJvb3QgPSBgJHtyb290fSBHUk9VUCBCWSB0aW1lKCR7Z2J9KWBcblx0XHR9XG5cblx0XHRpZiggZ3JvdXBCeVRhZy5sZW5ndGggPiAwICl7XG5cdFx0XHRyb290ID0gKCAhZ3JvdXBCeVRpbWUgKSA/IGAke3Jvb3R9IEdST1VQIEJZYCA6IGAke3Jvb3R9LGA7IFxuXG5cdFx0XHRncm91cEJ5VGFnLmZvckVhY2goIChlLGluZGV4KSA9PiB7XG5cdFx0XHRcdHJvb3QgPSBgJHtyb290fSR7aW5kZXggPjAgPyAnLCAnIDogJyAnfSBcIiR7ZS5wYXJhbXNbIDAgXX1cImBcblx0XHRcdH0gKVxuXHRcdH1cblx0XHRcblx0XHRpZiggZ3JvdXBCeUZpbGwgKXtcblx0XHRcdHJvb3QgPSBgJHtyb290fSBGSUxMKCR7Z3JvdXBCeUZpbGwucGFyYW1zWyAwIF19KWBcblx0XHR9XG5cblx0XHRpZiggdGhpcy50YXJnZXQub3JkZXIgIT0gT3JkZXJCeVRpbWUuQXNjICl7XG5cdFx0XHRyb290ID0gYCR7cm9vdH0gT1JERVIgQlkgdGltZSBERVNDYDsgXG5cdFx0fVxuXHRcdFxuXHRcdGlmKCB0aGlzLnRhcmdldC5saW1pdCA+IDAgKXtcblx0XHRcdHJvb3QgPSBgJHtyb290fSBMSU1JVCAke3RoaXMudGFyZ2V0LmxpbWl0fWA7XG5cdFx0fVxuXG5cdFx0aWYoIHRoaXMudGFyZ2V0LnNsaW1pdCA+IDAgKXtcblx0XHRcdHJvb3QgPSBgJHtyb290fSBTTElNSVQgJHt0aGlzLnRhcmdldC5zbGltaXR9YDtcblx0XHR9XG5cbiAgICByZXR1cm4gcm9vdDtcblx0fVxuXHRcbiAgZ2V0T3B0aW1hbEF1dG9Hcm91cEJ5KCkgOiBzdHJpbmcge1xuICAgIGNvbnN0IGYgPSBUaW1lUmFuZ2VQYXJzZXIudG9EYXRlVGltZSggdGhpcy5yYW5nZS5mcm9tLCBmYWxzZSApO1xuICAgIGNvbnN0IHQgPSBUaW1lUmFuZ2VQYXJzZXIudG9EYXRlVGltZSggdGhpcy5yYW5nZS50bywgdHJ1ZSApO1xuXG5cdFx0aWYgKDUgPiArdC5kaWZmKCBmLCBcIm1pbnV0ZXNcIiApKVxuXHRcdFx0cmV0dXJuIFwiMjAwbXNcIjtcblxuXHRcdGlmICgxNSA+ICt0LmRpZmYoIGYsIFwibWludXRlc1wiICkpXG5cdFx0XHRyZXR1cm4gXCIxc1wiO1xuXG5cdFx0aWYgKDMwID4gdC5kaWZmKCBmLCBcIm1pbnV0ZXNcIiApKVxuXHRcdFx0cmV0dXJuIFwiMnNcIjtcblxuXHRcdGlmICgxID4gdC5kaWZmKCBmLCBcImhvdXJzXCIgKSlcblx0XHRcdHJldHVybiBcIjVzXCI7XHRcdFxuXG5cdFx0aWYgKDMgPiB0LmRpZmYoIGYsIFwiaG91cnNcIiApKVxuXHRcdFx0cmV0dXJuIFwiMTBzXCI7XHRcdFxuXG5cdFx0aWYgKDYgPiB0LmRpZmYoIGYsIFwiaG91cnNcIiApKVxuXHRcdFx0cmV0dXJuIFwiMjBzXCI7XHRcdFxuXG5cdFx0aWYgKDEyID4gdC5kaWZmKCBmLCBcImhvdXJzXCIgKSlcblx0XHRcdHJldHVybiBcIjFtXCI7XHRcdFxuXG5cdFx0aWYgKDI0ID4gdC5kaWZmKCBmLCBcImhvdXJzXCIgKSlcblx0XHRcdHJldHVybiBcIjJtXCI7XHRcdFxuXG5cdFx0aWYgKDcgPiB0LmRpZmYoIGYsIFwiZGF5c1wiICkpXG5cdFx0XHRyZXR1cm4gXCIxMG1cIjtcdFx0XG5cblx0XHRpZiAoMzEgPiB0LmRpZmYoIGYsIFwiZGF5c1wiICkpXG5cdFx0XHRyZXR1cm4gXCIxaFwiO1x0XHRcblxuXHRcdGlmICgzNjUgPiB0LmRpZmYoIGYsIFwiZGF5c1wiICkpXG5cdFx0XHRyZXR1cm4gXCIxMmhcIjtcdFx0XG5cblx0XHQgcmV0dXJuIFwiMjRoXCI7XG5cdH1cblxuICBnZXRUaW1lRmlsdGVyKCkge1xuICAgIGNvbnN0IHJhbmdlID0gdGhpcy5yYW5nZTtcbiAgICBjb25zdCB0eiA9IHRoaXMudGltZS5jb252ZXJ0ZXIudGltZXpvbmU7IC8vdGhpcy5yYW5nZS50aW1lem9uZTtcblxuICAgIGxldCBmcm9tID0gdGhpcy5nZXRJbmZsdXhUaW1lKCByYW5nZS5mcm9tLCBmYWxzZSwgdHopO1xuICAgIGxldCB0byA9IHRoaXMuZ2V0SW5mbHV4VGltZSggcmFuZ2UudG8sIHRydWUsIHR6KTtcblxuICAgIGNvbnN0IGZyb21Jc0Fic29sdXRlID0gZnJvbVtmcm9tLmxlbmd0aCAtIDFdID09PSAnbXMnO1xuXG4gICAgaWYgKHRvID09PSAnbm93KCknICYmICFmcm9tSXNBYnNvbHV0ZSkge1xuICAgICAgcmV0dXJuICd0aW1lID49ICcgKyBmcm9tO1xuICAgIH1cblxuICAgIHJldHVybiAndGltZSA+PSAnICsgZnJvbSArICcgYW5kIHRpbWUgPD0gJyArIHRvO1xuXHR9XG5cdFxuICBnZXRJbmZsdXhUaW1lKGRhdGU6IGFueSwgcm91bmRVcDogYW55LCB0aW1lem9uZTogVGltZXpvbmUpIHtcbiAgICBpZiAoXy5pc1N0cmluZyhkYXRlKSkge1xuICAgICAgaWYgKGRhdGUgPT09ICdub3cnKSB7XG4gICAgICAgIHJldHVybiAnbm93KCknO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwYXJ0cyA9IC9ebm93LShcXGQrKShbZGhtc10pJC8uZXhlYyhkYXRlKTtcblxuICAgICAgaWYgKHBhcnRzKSB7XG4gICAgICAgIGNvbnN0IGFtb3VudCA9IHBhcnNlSW50KHBhcnRzWzFdLCAxMCk7XG4gICAgICAgIGNvbnN0IHVuaXQgPSBwYXJ0c1syXTtcbiAgICAgICAgcmV0dXJuICdub3coKSAtICcgKyBhbW91bnQgKyB1bml0O1xuICAgICAgfVxuXG4gICAgICBkYXRlID0gVGltZVJhbmdlUGFyc2VyLnRvRGF0ZVRpbWUoZGF0ZSwgcm91bmRVcCwgdGltZXpvbmUpO1xuICAgIH1cblxuICAgIHJldHVybiBkYXRlLnZhbHVlT2YoKSArICdtcyc7XG4gIH1cbn0iXX0=