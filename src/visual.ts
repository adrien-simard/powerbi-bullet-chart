"use strict";

import powerbi from "powerbi-visuals-api";
import * as d3 from "d3";
import FormattingSettingsService from "powerbi-visuals-utils-formattingmodel/lib/FormattingSettingsService";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";

import { VisualSettingsModel } from "./settings";

import DataView = powerbi.DataView;
import DataViewObjects = powerbi.DataViewObjects;
import PrimitiveValue = powerbi.PrimitiveValue;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

interface BulletSettings {
    warningThreshold: number;
    barHeightRatio: number;
    showLegend: boolean;
    showCategoryLabels: boolean;
    showDataLabels: boolean;
    safeColor: string;
    warningColor: string;
    overBudgetColor: string;
    targetColor: string;
    labelColor: string;
    barLabelColor: string;
    valueDecimals: number;
    percentDecimals: number;
    showKCHF: boolean;
    fontSize: number;
    boldNumbers: boolean;
    useFieldDataFormat: boolean;
    labelPosition: "inside" | "bottom" | "top";
    autoLabelContrast: boolean;
    legendPosition: "top" | "bottom" | "left" | "right";
}

interface BulletRow {
    key: string;
    category: string;
    actual: number;
    target: number;
    ratio: number;
    forecast: number | null;
    forecastRatio: number;
    segments: ActualSegment[];
    actualFormat?: string;
    targetFormat?: string;
}

interface BulletData {
    rows: BulletRow[];
    hasExplicitTarget: boolean;
}

interface ActualSegment {
    legend: string;
    actual: number;
    color: string;
}

interface SegmentDatum {
    row: BulletRow;
    segment: ActualSegment;
}

const DEFAULT_SETTINGS: BulletSettings = {
    warningThreshold: 0.8,
    barHeightRatio: 0.58,
    showLegend: true,
    showCategoryLabels: true,
    showDataLabels: true,
    safeColor: "#e5e7eb",
    warningColor: "#f4c7a1",
    overBudgetColor: "#d92d20",
    targetColor: "#111827",
    labelColor: "#374151",
    barLabelColor: "#243244",
    valueDecimals: 0,
    percentDecimals: 0,
    showKCHF: true,
    fontSize: 12,
    boldNumbers: false,
    useFieldDataFormat: true,
    labelPosition: "inside",
    autoLabelContrast: true,
    legendPosition: "top"
};
const MAX_DOMAIN_CAP = 20;
const MIN_INSIDE_PERCENT_PX = 52;

function getObjectValue<T>(
    objects: DataViewObjects | undefined,
    objectName: string,
    propertyName: string,
    defaultValue: T
): T {
    const object = objects?.[objectName];
    const property = object?.[propertyName];
    return (property as T | undefined) ?? defaultValue;
}

function getFillColor(
    objects: DataViewObjects | undefined,
    objectName: string,
    propertyName: string,
    defaultValue: string
): string {
    const fill = getObjectValue<{ solid?: { color?: string } } | undefined>(objects, objectName, propertyName, undefined);
    return fill?.solid?.color ?? defaultValue;
}

export class Visual implements IVisual {
    private readonly host: IVisualHost;
    private readonly root: d3.Selection<HTMLDivElement, unknown, null, undefined>;
    private readonly legend: d3.Selection<HTMLDivElement, unknown, null, undefined>;
    private readonly svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    private readonly emptyState: d3.Selection<HTMLDivElement, unknown, null, undefined>;
    private readonly formattingSettingsService: FormattingSettingsService;

    private formattingSettings: VisualSettingsModel;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService(options.host.createLocalizationManager());
        this.formattingSettings = new VisualSettingsModel();

        const container = d3.select(options.element)
            .append("div")
            .classed("bullet-chart-root", true);

        this.root = container;
        this.legend = container
            .append("div")
            .classed("bullet-chart-legend", true);

        this.svg = container
            .append("svg")
            .classed("bullet-chart-svg", true)
            .attr("role", "img")
            .attr("aria-label", "Bullet chart");

        this.emptyState = container
            .append("div")
            .classed("bullet-chart-empty", true)
            .style("display", "none");
    }

    public update(options: VisualUpdateOptions): void {
        const viewport = options.viewport;
        this.root
            .style("width", `${viewport.width}px`)
            .style("height", `${viewport.height}px`);

        const dataView = options.dataViews?.[0];
        this.formattingSettings = dataView
            ? this.formattingSettingsService.populateFormattingSettingsModel(VisualSettingsModel, dataView)
            : new VisualSettingsModel();

        const settings = this.getSettings(dataView);
        const bulletData = this.getRows(dataView);
        const rows = bulletData.rows;

        if (!rows.length || viewport.width < 80 || viewport.height < 80) {
            this.renderEmpty("Ajoute Category et Actual pour afficher le bullet chart.");
            return;
        }

        this.emptyState.style("display", "none");
        this.svg.style("display", "block");
        this.renderLegend(rows, settings.showLegend, settings.legendPosition, settings);

        const svgNode = this.svg.node();
        const chartWidth = Math.max(80, svgNode?.clientWidth ?? viewport.width);
        const chartHeight = Math.max(80, svgNode?.clientHeight ?? viewport.height);
        this.renderChart(rows, chartWidth, chartHeight, settings, bulletData.hasExplicitTarget);
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel | undefined {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    private getSettings(dataView?: DataView): BulletSettings {
        const objects = dataView?.metadata?.objects;
        const pane = this.formattingSettings;

        return {
            warningThreshold: Math.max(0, Math.min(1, Number(pane.bulletChart.warningThreshold.value ?? DEFAULT_SETTINGS.warningThreshold))),
            barHeightRatio: Math.max(0.2, Math.min(0.9, Number(pane.bulletChart.barHeight.value ?? DEFAULT_SETTINGS.barHeightRatio))),
            showLegend: Boolean(pane.bulletChart.showLegend.value ?? getObjectValue(objects, "bulletChart", "showLegend", DEFAULT_SETTINGS.showLegend)),
            showCategoryLabels: Boolean(pane.bulletChart.showCategoryLabels.value ?? getObjectValue(objects, "bulletChart", "showCategoryLabels", DEFAULT_SETTINGS.showCategoryLabels)),
            showDataLabels: Boolean(pane.bulletChart.showDataLabels.value ?? getObjectValue(objects, "bulletChart", "showDataLabels", DEFAULT_SETTINGS.showDataLabels)),
            safeColor: pane.colors.safeColor.value?.value ?? getFillColor(objects, "colors", "safeColor", DEFAULT_SETTINGS.safeColor),
            warningColor: pane.colors.warningColor.value?.value ?? getFillColor(objects, "colors", "warningColor", DEFAULT_SETTINGS.warningColor),
            overBudgetColor: pane.colors.overBudgetColor.value?.value ?? getFillColor(objects, "colors", "overBudgetColor", DEFAULT_SETTINGS.overBudgetColor),
            targetColor: pane.colors.targetColor.value?.value ?? getFillColor(objects, "colors", "targetColor", DEFAULT_SETTINGS.targetColor),
            labelColor: pane.colors.labelColor.value?.value ?? getFillColor(objects, "colors", "labelColor", DEFAULT_SETTINGS.labelColor),
            barLabelColor: pane.colors.barLabelColor.value?.value ?? getFillColor(objects, "colors", "barLabelColor", DEFAULT_SETTINGS.barLabelColor),
            valueDecimals: Math.max(0, Math.min(6, Number(pane.numberFormat.valueDecimals.value ?? DEFAULT_SETTINGS.valueDecimals))),
            percentDecimals: Math.max(0, Math.min(4, Number(pane.numberFormat.percentDecimals.value ?? DEFAULT_SETTINGS.percentDecimals))),
            showKCHF: Boolean(pane.numberFormat.showKCHF.value ?? DEFAULT_SETTINGS.showKCHF),
            fontSize: Math.max(8, Math.min(24, Number(pane.numberFormat.fontSize.value ?? DEFAULT_SETTINGS.fontSize))),
            boldNumbers: Boolean(pane.numberFormat.boldNumbers.value ?? DEFAULT_SETTINGS.boldNumbers),
            useFieldDataFormat: Boolean(pane.numberFormat.useFieldDataFormat.value ?? DEFAULT_SETTINGS.useFieldDataFormat),
            labelPosition: this.normalizeLabelPosition(String(pane.bulletChart.labelPosition.value?.value ?? DEFAULT_SETTINGS.labelPosition)),
            autoLabelContrast: Boolean(pane.bulletChart.autoLabelContrast.value ?? DEFAULT_SETTINGS.autoLabelContrast),
            legendPosition: this.normalizeLegendPosition(String(pane.bulletChart.legendPosition.value?.value ?? DEFAULT_SETTINGS.legendPosition))
        };
    }

    private getRows(dataView?: DataView): BulletData {
        const categorical = dataView?.categorical;
        const categoryColumn = categorical?.categories?.[0];
        const valueColumns = categorical?.values;

        if (!categoryColumn || !valueColumns || valueColumns.length === 0) {
            return { rows: [], hasExplicitTarget: false };
        }

        const grouped = valueColumns.grouped();
        if (!grouped.length) {
            return { rows: [], hasExplicitTarget: false };
        }

        let hasExplicitTarget = false;
        const rowByCategory = new Map<string, BulletRow>();

        grouped.forEach((group, groupIndex) => {
            const legendName = this.getLegendName(group.name ?? null, groupIndex);
            const seriesColor = this.host.colorPalette.getColor(legendName).value;
            const actualColumn = group.values.find((column) => Boolean(column.source.roles?.actual));
            const targetColumn = group.values.find((column) => Boolean(column.source.roles?.target));
            const forecastColumn = group.values.find((column) => Boolean(column.source.roles?.forecast));
            hasExplicitTarget = hasExplicitTarget || Boolean(targetColumn);

            if (!actualColumn) {
                return;
            }

            categoryColumn.values.forEach((categoryValue, categoryIndex) => {
                const actual = this.toNumber(actualColumn.values[categoryIndex]);
                const target = targetColumn ? this.toNumber(targetColumn.values[categoryIndex]) : null;
                const forecast = forecastColumn ? this.toNumber(forecastColumn.values[categoryIndex]) : null;

                if (actual === null || (target !== null && target <= 0)) {
                    return;
                }

                const safeActual = Number.isFinite(actual) ? actual : 0;
                const safeTarget = Number.isFinite(target ?? 0) ? (target ?? 0) : 0;
                const safeForecast = Number.isFinite(forecast ?? NaN) ? (forecast as number) : null;

                const category = this.formatPrimitive(categoryValue);
                const existing = rowByCategory.get(category);

                if (!existing) {
                    rowByCategory.set(category, {
                        key: category,
                        category,
                        actual: safeActual,
                        target: safeTarget,
                        ratio: 0,
                        forecast: safeForecast,
                        forecastRatio: 0,
                        actualFormat: actualColumn.source.format,
                        targetFormat: targetColumn?.source.format,
                        segments: [
                            {
                                legend: legendName,
                                actual: safeActual,
                                color: seriesColor
                            }
                        ]
                    });
                    return;
                }

                existing.actual += safeActual;
                existing.target += safeTarget;
                existing.forecast = (existing.forecast ?? 0) + (safeForecast ?? 0);
                existing.actualFormat = existing.actualFormat || actualColumn.source.format;
                existing.targetFormat = existing.targetFormat || targetColumn?.source.format;
                const segment = existing.segments.find((item) => item.legend === legendName);
                if (segment) {
                    segment.actual += safeActual;
                } else {
                    existing.segments.push({
                        legend: legendName,
                        actual: safeActual,
                        color: seriesColor
                    });
                }
            });
        });

        const rows = Array.from(rowByCategory.values());

        if (!hasExplicitTarget) {
            const inferredTarget = Math.max(d3.max(rows, (row) => row.actual) ?? 1, 1e-9);
            rows.forEach((row) => {
                row.target = inferredTarget;
                row.ratio = inferredTarget > 0 ? row.actual / inferredTarget : 0;
                row.forecastRatio = row.forecast !== null && inferredTarget > 0 ? row.forecast / inferredTarget : 0;
            });
        } else {
            rows.forEach((row) => {
                row.ratio = row.target > 0 ? row.actual / row.target : 0;
                row.forecastRatio = row.forecast !== null && row.target > 0 ? row.forecast / row.target : 0;
            });
        }

        return {
            rows: rows.slice(0, 50),
            hasExplicitTarget
        };
    }

    private renderLegend(
        rows: BulletRow[],
        showLegend: boolean,
        legendPosition: "top" | "bottom" | "left" | "right",
        settings: BulletSettings
    ): void {
        this.legend.selectAll("*").remove();

        const legendItems = Array.from(new Map(
            rows.flatMap((row) => row.segments.map((segment) => [segment.legend, segment.color] as [string, string]))
        ).entries()).map(([name, fill]) => ({ name, fill }));

        legendItems.unshift(
            { name: "Threshold-target", fill: settings.warningColor },
            { name: "Over budget", fill: settings.overBudgetColor }
        );

        const hasForecast = rows.some((row) => row.forecast !== null && row.forecast > row.actual);
        if (hasForecast) {
            legendItems.push({
                name: "Forecast top-up",
                fill: "repeating-linear-gradient(45deg, #d1d5db 0px, #d1d5db 6px, #9ca3af 6px, #9ca3af 8px)"
            });
        }
        const legendFontSize = `${Math.max(9, Math.round(this.getCurrentFontSize() - 1))}px`;

        if (!showLegend || legendItems.length === 0) {
            this.legend.style("display", "none");
            this.root
                .style("display", "block");
            this.svg
                .style("width", "100%")
                .style("height", "100%");
            return;
        }

        this.root.style("display", "flex");
        this.legend.style("display", "flex");
        this.legend.style("font-size", legendFontSize);
        this.legend.style("align-items", "center");
        this.legend.style("flex-wrap", "wrap");
        this.legend.style("column-gap", "10px");
        this.legend.style("row-gap", "6px");
        this.svg.style("flex", "1 1 auto");

        this.legend
            .append("span")
            .classed("bullet-chart-legend-title", true)
            .style("display", "inline-block")
            .style("margin-right", "10px")
            .style("font-weight", "600")
            .style("white-space", "nowrap")
            .text("Type");

        if (legendPosition === "left" || legendPosition === "right") {
            this.root
                .style("flex-direction", "row")
                .style("align-items", "stretch");

            this.legend
                .style("order", legendPosition === "left" ? "0" : "1")
                .style("width", "180px")
                .style("min-width", "180px")
                .style("max-width", "220px")
                .style("height", "100%")
                .style("flex-direction", "column")
                .style("align-content", "flex-start")
                .style("align-items", "flex-start")
                .style("overflow", "auto");

            this.svg
                .style("order", legendPosition === "left" ? "1" : "0")
                .style("width", "auto")
                .style("height", "100%");
        } else {
            this.root
                .style("flex-direction", "column")
                .style("align-items", "stretch");

            this.legend
                .style("order", legendPosition === "top" ? "0" : "1")
                .style("width", "100%")
                .style("min-width", "0")
                .style("max-width", "none")
                .style("height", "auto")
                .style("flex-direction", "row")
                .style("align-items", "center")
                .style("overflow", "visible");

            this.svg
                .style("order", legendPosition === "top" ? "1" : "0")
                .style("width", "100%")
                .style("height", "auto");
        }

        const items = this.legend
            .selectAll<HTMLSpanElement, { name: string; fill: string }>(".bullet-chart-legend-item")
            .data(legendItems)
            .enter()
            .append("span")
            .classed("bullet-chart-legend-item", true)
            .style("display", "inline-flex")
            .style("align-items", "center")
            .style("column-gap", "6px")
            .style("padding-right", "6px")
            .style("white-space", "nowrap");

        items
            .append("span")
            .classed("bullet-chart-legend-swatch", true)
            .style("display", "inline-block")
            .style("width", "12px")
            .style("height", "12px")
            .style("border-radius", "999px")
            .style("border", "1px solid rgba(0, 0, 0, 0.2)")
            .style("background", (d) => d.fill);

        items
            .append("span")
            .style("display", "inline-block")
            .style("white-space", "nowrap")
            .text((d) => d.name);
    }

    private renderChart(rows: BulletRow[], width: number, height: number, settings: BulletSettings, hasExplicitTarget: boolean): void {
        this.svg.selectAll("*").remove();
        this.applyFontStyles(settings);

        const legendOffset = this.legend.style("display") === "none" ? 0 : 36;
        const outerWidth = Math.max(width, 240);
        const outerHeight = Math.max(height - legendOffset, 140);
        const rowHeight = 30;
        const chartHeight = Math.max(outerHeight, rows.length * rowHeight + 56);
        const maxLabelLength = d3.max(rows, (row) => row.category.length) ?? 12;
        const computedLeft = Math.min(260, Math.max(110, maxLabelLength * 6 + 28));
        const margin = {
            top: 12,
            right: hasExplicitTarget ? 140 : 24,
            bottom: 32,
            left: settings.showCategoryLabels ? computedLeft : 24
        };

        const innerWidth = Math.max(outerWidth - margin.left - margin.right, 80);
        const innerHeight = Math.max(chartHeight - margin.top - margin.bottom, 60);
        const maxRatio = Math.max(
            1.2,
            Math.min(
                MAX_DOMAIN_CAP,
                d3.max(rows, (row) => Math.max(this.sanitizeRatio(row.ratio), this.sanitizeRatio(row.forecastRatio), 1)) ?? 1.2
            )
        );
        const domainMax = this.transformRatio(maxRatio);

        const x = d3.scaleLinear()
            .domain([0, domainMax])
            .range([0, innerWidth]);
        const xRatio = (ratio: number): number => x(this.transformRatio(Math.min(this.sanitizeRatio(ratio), maxRatio)));

        const y = d3.scaleBand<string>()
            .domain(rows.map((row) => row.key))
            .range([0, innerHeight])
            .padding(0.25);

        this.svg
            .attr("viewBox", `0 0 ${outerWidth} ${chartHeight}`)
            .attr("preserveAspectRatio", "xMinYMin meet");

        const root = this.svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        const defs = this.svg.append("defs");
        const pattern = defs.append("pattern")
            .attr("id", "forecastHatch")
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", 8)
            .attr("height", 8)
            .attr("patternTransform", "rotate(45)");
        pattern.append("rect")
            .attr("width", 8)
            .attr("height", 8)
            .attr("fill", "#d1d5db");
        pattern.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", 8)
            .attr("stroke", "#9ca3af")
            .attr("stroke-width", 2);

        const ticks = this.getAxisTicks(maxRatio).map((ratio) => ({
            raw: ratio,
            transformed: this.transformRatio(ratio)
        }));

        root.append("g")
            .attr("class", "grid")
            .selectAll("line")
            .data(ticks)
            .enter()
            .append("line")
            .attr("x1", (d) => x(d.transformed))
            .attr("x2", (d) => x(d.transformed))
            .attr("y1", 0)
            .attr("y2", innerHeight)
            .attr("stroke", "#cfd4db");

        root.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(
                d3.axisBottom(x)
                    .tickValues(ticks.map((d) => d.transformed))
                    .tickFormat((value) => {
                        const numeric = Number(value);
                        const rawTick = this.inverseTransformRatio(numeric);
                        return d3.format(".0%")(rawTick);
                    })
            );

        const groups = root
            .selectAll<SVGGElement, BulletRow>(".bullet-row")
            .data(rows)
            .enter()
            .append("g")
            .attr("class", "bullet-row")
            .attr("transform", (d) => `translate(0,${y(d.key) ?? 0})`);

        groups
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", xRatio(Math.min(settings.warningThreshold, maxRatio)))
            .attr("height", y.bandwidth())
            .attr("fill", settings.safeColor);

        groups
            .append("rect")
            .attr("x", xRatio(settings.warningThreshold))
            .attr("y", 0)
            .attr("width", Math.max(0, xRatio(Math.min(1, maxRatio)) - xRatio(settings.warningThreshold)))
            .attr("height", y.bandwidth())
            .attr("fill", settings.warningColor);

        const segmentGroups = groups
            .append("g")
            .attr("class", "actual-segments");

        segmentGroups.each((row, rowIndex, nodes) => {
            const g = d3.select(nodes[rowIndex]);
            let cursor = 0;
            const barTop = y.bandwidth() * ((1 - settings.barHeightRatio) / 2);
            const barHeight = y.bandwidth() * settings.barHeightRatio;
            const targetValue = row.target > 0 ? row.target : 1;
            const maxUntilTarget = Math.min(this.sanitizeRatio(row.ratio), 1, maxRatio);
            const availableWidth = xRatio(maxUntilTarget);

            row.segments.forEach((segment) => {
                const rawSegmentWidth = xRatio(Math.max(0, segment.actual / targetValue));
                const segmentWidth = Math.max(0, Math.min(rawSegmentWidth, availableWidth - cursor));
                if (segmentWidth <= 0) {
                    return;
                }

                g.append("rect")
                    .attr("class", "actual-bar")
                    .attr("x", cursor)
                    .attr("y", barTop)
                    .attr("height", barHeight)
                    .attr("width", segmentWidth)
                    .attr("fill", segment.color)
                    .datum({
                        row,
                        segment
                    } as SegmentDatum);

                cursor += segmentWidth;
            });
        });

        groups
            .append("rect")
            .attr("class", "over-budget-bar")
            .attr("x", xRatio(Math.min(1, maxRatio)))
            .attr("y", y.bandwidth() * ((1 - settings.barHeightRatio) / 2))
            .attr("height", y.bandwidth() * settings.barHeightRatio)
            .attr("width", (d) => d.actual > d.target ? Math.max(0, xRatio(Math.min(this.sanitizeRatio(d.ratio), maxRatio)) - xRatio(Math.min(1, maxRatio))) : 0)
            .attr("fill", settings.overBudgetColor);

        // Forecast top-up: hatched gray segment from Actual to Forecast.
        groups
            .append("rect")
            .attr("class", "forecast-topup-bar")
            .attr("x", (d) => xRatio(Math.min(this.sanitizeRatio(d.ratio), maxRatio)))
            .attr("y", y.bandwidth() * ((1 - settings.barHeightRatio) / 2))
            .attr("height", y.bandwidth() * settings.barHeightRatio)
            .attr("width", (d) => {
                if (d.forecast === null) {
                    return 0;
                }

                const from = Math.min(this.sanitizeRatio(d.ratio), maxRatio);
                const to = Math.min(this.sanitizeRatio(d.forecastRatio), maxRatio);
                return to > from ? Math.max(0, xRatio(to) - xRatio(from)) : 0;
            })
            .attr("fill", "url(#forecastHatch)")
            .attr("stroke", "#9ca3af")
            .attr("stroke-width", 0.5);

        const targetLines = groups
            .append("line")
            .attr("class", "target-line")
            .attr("x1", xRatio(Math.min(1, maxRatio)))
            .attr("x2", xRatio(Math.min(1, maxRatio)))
            .attr("y1", 0)
            .attr("y2", y.bandwidth())
            .attr("stroke", settings.targetColor)
            .attr("stroke-width", 1.5);

        const targetHoverAreas = groups
            .append("rect")
            .attr("class", "target-hover")
            .attr("x", xRatio(Math.min(1, maxRatio)) - 6)
            .attr("y", 0)
            .attr("width", 12)
            .attr("height", y.bandwidth())
            .attr("fill", "transparent");

        if (settings.showCategoryLabels) {
            const categoryLabels = this.svg.append("g")
                .selectAll<SVGTextElement, BulletRow>(".category-label")
                .data(rows)
                .enter()
                .append("text")
                .attr("class", "category-label")
                .attr("x", margin.left - 10)
                .attr("y", (d) => margin.top + (y(d.key) ?? 0) + y.bandwidth() / 2)
                .attr("text-anchor", "end")
                .attr("dominant-baseline", "middle")
                .attr("fill", settings.labelColor)
                .text((d) => d.category);

            const budgetLabels = this.svg.append("g")
                .selectAll<SVGTextElement, BulletRow>(".budget-label")
                .data(rows)
                .enter()
                .append("text")
                .attr("class", "value-label budget-label")
                .attr("x", margin.left - 10)
                .attr("y", (d) => margin.top + (y(d.key) ?? 0) + y.bandwidth() / 2 + Math.max(10, Math.round(settings.fontSize * 0.95)))
                .attr("text-anchor", "end")
                .attr("dominant-baseline", "middle")
                .attr("fill", "#6b7280")
                .text((d) => hasExplicitTarget ? `Budget: ${this.formatValue(d.target, settings, d.targetFormat)}` : "");

            this.bindTooltip<BulletRow>(budgetLabels as any, (d) => this.getTargetTooltipItems(d, hasExplicitTarget, settings));
        }

        if (settings.showDataLabels) {
            // Percentage + actual amount inside the bar, only when bar is wide enough.
            groups
                .append("text")
                .attr("class", "value-label")
                .attr("font-size", `${Math.max(9, Math.round(settings.fontSize - 1))}px`)
                .attr("text-anchor", "middle")
                .attr("x", (d) => {
                    const ratioPx = xRatio(Math.min(this.sanitizeRatio(d.ratio), 1, maxRatio));
                    return ratioPx / 2;
                })
                .attr("y", () => this.getBarLabelY(y.bandwidth(), settings))
                .attr("dominant-baseline", () => this.getBarLabelBaseline(settings))
                .attr("fill", (d) => this.resolveBarLabelColor(d, settings, domainMax))
                .text((d) => {
                    const ratioPx = xRatio(Math.min(this.sanitizeRatio(d.ratio), 1, maxRatio));
                    const minimumWidth = settings.labelPosition === "inside" ? MIN_INSIDE_PERCENT_PX : 10;
                    if (ratioPx < minimumWidth) {
                        return "";
                    }

                    if (!hasExplicitTarget) {
                        return this.formatValue(d.actual, settings, d.actualFormat);
                    }

                    return `${this.formatPercent(this.sanitizeRatio(d.ratio), settings)} ${this.formatValue(d.actual, settings, d.actualFormat)}`;
                });
        }

        const actualBars = root.selectAll<SVGRectElement, SegmentDatum>(".actual-bar");
        this.bindTooltip<SegmentDatum>(actualBars, (d) => this.getActualTooltipItems(d, hasExplicitTarget, settings));
        const overBudgetBars = root.selectAll<SVGRectElement, BulletRow>(".over-budget-bar");
        this.bindTooltip<BulletRow>(overBudgetBars as any, (d) => this.getOverBudgetTooltipItems(d, hasExplicitTarget, settings));
        this.bindTooltip<BulletRow>(targetHoverAreas as any, (d) => this.getTargetTooltipItems(d, hasExplicitTarget, settings));
        const forecastBars = root.selectAll<SVGRectElement, BulletRow>(".forecast-topup-bar");
        this.bindTooltip<BulletRow>(forecastBars as any, (d) => this.getForecastTooltipItems(d, hasExplicitTarget, settings));
        this.applyFontStyles(settings);
    }

    private renderEmpty(message: string): void {
        this.legend.style("display", "none");
        this.svg.selectAll("*").remove();
        this.svg.style("display", "none");
        this.emptyState.style("display", "flex").text(message);
    }

    private getLegendName(value: PrimitiveValue, index: number): string {
        const label = this.formatPrimitive(value);
        return label || `Series ${index + 1}`;
    }

    private formatPrimitive(value: PrimitiveValue): string {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value);
    }

    private toNumber(value: PrimitiveValue): number | null {
        if (value === null || value === undefined) {
            return null;
        }

        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : null;
    }

    private formatLabelValue(actual: number, ratio: number, hasExplicitTarget: boolean, settings: BulletSettings, format?: string): string {
        const actualText = this.formatValue(actual, settings, format);

        if (!hasExplicitTarget) {
            return actualText;
        }

        const pctText = this.formatPercent(ratio, settings);

        return `${actualText} (${pctText})`;
    }

    private sanitizeRatio(value: number): number {
        if (!Number.isFinite(value) || value < 0) {
            return 0;
        }

        return Math.min(value, MAX_DOMAIN_CAP);
    }

    // Piecewise scale: linear to 100%, logarithmic above to avoid crushing the chart.
    private transformRatio(value: number): number {
        const safe = this.sanitizeRatio(value);
        if (safe <= 1) {
            return safe;
        }

        return 1 + Math.log1p(safe - 1);
    }

    private inverseTransformRatio(value: number): number {
        if (!Number.isFinite(value) || value <= 0) {
            return 0;
        }

        if (value <= 1) {
            return value;
        }

        return 1 + (Math.exp(value - 1) - 1);
    }

    private getAxisTicks(maxRatio: number): number[] {
        const linearTicks = [0, 0.2, 0.4, 0.6, 0.8, 1];
        if (maxRatio <= 1) {
            return linearTicks.filter((tick) => tick <= maxRatio);
        }

        const logTicks = [1.2, 1.5, 2, 3, 5, 8, 10, 15, 20].filter((tick) => tick <= maxRatio);
        return [...linearTicks, ...logTicks];
    }

    private getActualTooltipItems(d: SegmentDatum, hasExplicitTarget: boolean, settings: BulletSettings): VisualTooltipDataItem[] {
        const target = d.row.target > 0 ? d.row.target : 0;
        const ratio = hasExplicitTarget && target > 0 ? d.segment.actual / target : d.row.ratio;

        return [
            { displayName: "Category", value: d.row.category },
            { displayName: "Fund", value: d.segment.legend },
            { displayName: "Actual (%)", value: this.formatPercent(Math.max(0, ratio), settings) },
            { displayName: settings.showKCHF ? "Actual (kCHF)" : "Actual", value: this.formatValue(d.segment.actual, settings, d.row.actualFormat) }
        ];
    }

    private getTargetTooltipItems(row: BulletRow, hasExplicitTarget: boolean, settings: BulletSettings): VisualTooltipDataItem[] {
        if (!hasExplicitTarget) {
            return [
                { displayName: "Category", value: row.category },
                { displayName: "Budget", value: "Target non fourni (infere)" }
            ];
        }

        return [
            { displayName: "Category", value: row.category },
            { displayName: settings.showKCHF ? "Budget (kCHF)" : "Budget", value: this.formatValue(row.target, settings, row.targetFormat) }
        ];
    }

    private getForecastTooltipItems(row: BulletRow, hasExplicitTarget: boolean, settings: BulletSettings): VisualTooltipDataItem[] {
        if (row.forecast === null || row.forecast <= row.actual) {
            return [];
        }

        const target = row.target > 0 ? row.target : 0;
        const forecastPct = hasExplicitTarget && target > 0 ? row.forecast / target : row.forecastRatio;
        const topUpValue = Math.max(0, row.forecast - row.actual);
        const topUpPct = hasExplicitTarget && target > 0 ? topUpValue / target : Math.max(0, row.forecastRatio - row.ratio);

        return [
            { displayName: "Category", value: row.category },
            { displayName: "Forecast (%)", value: this.formatPercent(this.sanitizeRatio(forecastPct), settings) },
            { displayName: settings.showKCHF ? "Forecast (kCHF)" : "Forecast", value: this.formatValue(row.forecast, settings, row.actualFormat) },
            { displayName: "Expected (%)", value: this.formatPercent(this.sanitizeRatio(topUpPct), settings) },
            { displayName: settings.showKCHF ? "Expected (kCHF)" : "Expected", value: this.formatValue(topUpValue, settings, row.actualFormat) }
        ];
    }

    private getOverBudgetTooltipItems(row: BulletRow, hasExplicitTarget: boolean, settings: BulletSettings): VisualTooltipDataItem[] {
        if (row.actual <= row.target) {
            return [];
        }

        const target = row.target > 0 ? row.target : 0;
        const overValue = Math.max(0, row.actual - row.target);
        const overPct = hasExplicitTarget && target > 0 ? overValue / target : Math.max(0, row.ratio - 1);

        return [
            { displayName: "Category", value: row.category },
            { displayName: "Over budget (%)", value: this.formatPercent(this.sanitizeRatio(overPct), settings) },
            { displayName: settings.showKCHF ? "Over budget (kCHF)" : "Over budget", value: this.formatValue(overValue, settings, row.actualFormat) },
            { displayName: "Actual (%)", value: this.formatPercent(this.sanitizeRatio(row.ratio), settings) },
            { displayName: settings.showKCHF ? "Actual (kCHF)" : "Actual", value: this.formatValue(row.actual, settings, row.actualFormat) }
        ];
    }

    private formatValue(value: number, settings: BulletSettings, format?: string): string {
        if (settings.useFieldDataFormat && format) {
            const formatted = valueFormatter.format(value, format);
            return settings.showKCHF ? formatted : formatted.replace(/\s*kCHF\b/gi, "").trim();
        }

        const decimals = Math.max(0, Math.min(6, Math.floor(settings.valueDecimals)));
        const valueText = d3.format(`,.${decimals}f`)(value);
        return settings.showKCHF ? `${valueText} kCHF` : valueText;
    }

    private formatPercent(value: number, settings: BulletSettings): string {
        const decimals = Math.max(0, Math.min(4, Math.floor(settings.percentDecimals)));
        return d3.format(`.${decimals}%`)(value);
    }

    private normalizeLegendPosition(value: string): "top" | "bottom" | "left" | "right" {
        const normalized = value.toLowerCase();
        if (normalized === "top" || normalized === "bottom" || normalized === "left" || normalized === "right") {
            return normalized;
        }

        return "top";
    }

    private normalizeLabelPosition(value: string): "inside" | "bottom" | "top" {
        const normalized = value.toLowerCase();
        if (normalized === "inside" || normalized === "bottom" || normalized === "top") {
            return normalized;
        }

        return "inside";
    }

    private getCurrentFontSize(): number {
        return Math.max(8, Math.min(24, Number(this.formattingSettings.numberFormat.fontSize.value ?? DEFAULT_SETTINGS.fontSize)));
    }

    private applyFontStyles(settings: BulletSettings): void {
        const axisFont = `${Math.max(9, Math.round(settings.fontSize - 1))}px`;
        const categoryFont = `${Math.round(settings.fontSize)}px`;
        const valueFont = `${Math.max(9, Math.round(settings.fontSize))}px`;
        const numberWeight = settings.boldNumbers ? "700" : "600";

        this.svg.selectAll<SVGTextElement, unknown>(".axis text")
            .style("font-size", axisFont)
            .style("font-weight", numberWeight);
        this.svg.selectAll<SVGTextElement, unknown>(".category-label")
            .style("font-size", categoryFont);
        this.svg.selectAll<SVGTextElement, unknown>(".value-label")
            .style("font-size", valueFont)
            .style("font-weight", numberWeight);
    }

    private getBarLabelY(bandWidth: number, settings: BulletSettings): number {
        const barTop = bandWidth * ((1 - settings.barHeightRatio) / 2);
        const barBottom = barTop + (bandWidth * settings.barHeightRatio);
        if (settings.labelPosition === "top") {
            return barTop - 2;
        }
        if (settings.labelPosition === "bottom") {
            return barBottom + 2;
        }

        return bandWidth / 2;
    }

    private getBarLabelBaseline(settings: BulletSettings): string {
        if (settings.labelPosition === "top") {
            return "auto";
        }
        if (settings.labelPosition === "bottom") {
            return "hanging";
        }

        return "middle";
    }

    private resolveBarLabelColor(row: BulletRow, settings: BulletSettings, domainMax: number): string {
        if (!settings.autoLabelContrast) {
            return settings.barLabelColor;
        }

        if (settings.labelPosition !== "inside") {
            return this.ensureReadableText(settings.barLabelColor, "#f8fafc");
        }

        const bgColor = this.getInsideLabelBackground(row, domainMax);
        return this.ensureReadableText(settings.barLabelColor, bgColor);
    }

    private getInsideLabelBackground(row: BulletRow, domainMax: number): string {
        const cappedRatio = Math.min(this.sanitizeRatio(row.ratio), 1, domainMax);
        if (cappedRatio <= 0 || row.segments.length === 0 || row.target <= 0) {
            return "#e5e7eb";
        }

        const labelValueRatio = cappedRatio / 2;
        let cumulative = 0;
        for (const segment of row.segments) {
            cumulative += Math.max(0, segment.actual / row.target);
            if (labelValueRatio <= cumulative) {
                return segment.color;
            }
        }

        return row.segments[row.segments.length - 1].color;
    }

    private ensureReadableText(preferredColor: string, backgroundColor: string): string {
        const preferred = d3.color(preferredColor);
        const bg = d3.color(backgroundColor);
        if (!preferred || !bg) {
            return preferredColor;
        }

        const preferredContrast = this.contrastRatio(preferred, bg);
        if (preferredContrast >= 3) {
            return preferredColor;
        }

        const white = d3.rgb("#ffffff");
        const black = d3.rgb("#111827");
        return this.contrastRatio(white, bg) >= this.contrastRatio(black, bg) ? "#ffffff" : "#111827";
    }

    private contrastRatio(a: any, b: any): number {
        const l1 = this.relativeLuminance(a);
        const l2 = this.relativeLuminance(b);
        const brightest = Math.max(l1, l2);
        const darkest = Math.min(l1, l2);
        return (brightest + 0.05) / (darkest + 0.05);
    }

    private relativeLuminance(color: any): number {
        const rgb = d3.rgb(color);
        const toLinear = (channel: number): number => {
            const c = channel / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        };

        const r = toLinear(rgb.r);
        const g = toLinear(rgb.g);
        const b = toLinear(rgb.b);
        return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
    }

    private bindTooltip<T>(
        selection: d3.Selection<d3.BaseType, T, any, any>,
        getItems: (data: T) => VisualTooltipDataItem[]
    ): void {
        selection
            .on("mouseover.tooltip", (event: MouseEvent, data: T) => {
                const items = getItems(data);
                if (!items || !items.length) {
                    return;
                }

                this.host.tooltipService.show({
                    coordinates: [event.clientX, event.clientY],
                    isTouchEvent: false,
                    dataItems: items,
                    identities: []
                } as any);
            })
            .on("mousemove.tooltip", (event: MouseEvent, data: T) => {
                const items = getItems(data);
                if (!items || !items.length) {
                    return;
                }

                this.host.tooltipService.move({
                    coordinates: [event.clientX, event.clientY],
                    isTouchEvent: false,
                    dataItems: items,
                    identities: []
                } as any);
            })
            .on("mouseout.tooltip", () => {
                this.host.tooltipService.hide({
                    isTouchEvent: false,
                    immediately: true
                } as any);
            });
    }
}
