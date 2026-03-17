import powerbi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import ValidatorType = powerbi.visuals.ValidatorType;
import IEnumMember = powerbi.IEnumMember;

const FONT_ITEMS: IEnumMember[] = [
    { value: "Segoe UI", displayName: "Segoe UI" },
    { value: "Arial", displayName: "Arial" },
    { value: "Calibri", displayName: "Calibri" },
    { value: "Tahoma", displayName: "Tahoma" },
    { value: "Verdana", displayName: "Verdana" }
];

class BulletChartCardSettings extends formattingSettings.SimpleCard {
    name = "bulletChart";
    displayName = "Visual";
    analyticsPane = false;

    warningThreshold = new formattingSettings.Slider({
        name: "warningThreshold",
        displayName: "Warning threshold",
        value: 0.8,
        options: {
            minValue: { type: ValidatorType.Min, value: 0 },
            maxValue: { type: ValidatorType.Max, value: 1 }
        }
    });

    barHeight = new formattingSettings.Slider({
        name: "barHeight",
        displayName: "Bar height ratio",
        value: 0.58,
        options: {
            minValue: { type: ValidatorType.Min, value: 0.2 },
            maxValue: { type: ValidatorType.Max, value: 0.9 }
        }
    });

    seriesOpacity = new formattingSettings.Slider({
        name: "seriesOpacity",
        displayName: "Series opacity",
        value: 1,
        options: {
            minValue: { type: ValidatorType.Min, value: 0.1 },
            maxValue: { type: ValidatorType.Max, value: 1 }
        }
    });

    showCategoryLabels = new formattingSettings.ToggleSwitch({
        name: "showCategoryLabels",
        displayName: "Show category labels",
        value: true
    });

    slices = [
        this.warningThreshold,
        this.barHeight,
        this.seriesOpacity,
        this.showCategoryLabels
    ];
}

class ColorsCardSettings extends formattingSettings.SimpleCard {
    name = "colors";
    displayName = "Data colors";
    analyticsPane = false;

    safeColor = new formattingSettings.ColorPicker({
        name: "safeColor",
        displayName: "0-threshold zone",
        value: { value: "#e5e7eb" }
    });

    warningColor = new formattingSettings.ColorPicker({
        name: "warningColor",
        displayName: "Threshold-target zone",
        value: { value: "#f4c7a1" }
    });

    overBudgetColor = new formattingSettings.ColorPicker({
        name: "overBudgetColor",
        displayName: "Over budget",
        value: { value: "#d92d20" }
    });

    targetColor = new formattingSettings.ColorPicker({
        name: "targetColor",
        displayName: "Target line",
        value: { value: "#111827" }
    });

    labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayName: "Category text",
        value: { value: "#374151" }
    });

    barLabelColor = new formattingSettings.ColorPicker({
        name: "barLabelColor",
        displayName: "Data label color",
        value: { value: "#243244" }
    });

    slices = [
        this.safeColor,
        this.warningColor,
        this.overBudgetColor,
        this.targetColor,
        this.labelColor,
        this.barLabelColor
    ];
}

class DataLabelsCardSettings extends formattingSettings.SimpleCard {
    name = "dataLabels";
    displayName = "Data labels";
    analyticsPane = false;

    showDataLabels = new formattingSettings.ToggleSwitch({
        name: "showDataLabels",
        displayName: "Show data labels",
        value: true
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text size",
        value: 12,
        options: {
            minValue: { type: ValidatorType.Min, value: 8 },
            maxValue: { type: ValidatorType.Max, value: 24 }
        }
    });

    fontFamily = new formattingSettings.ItemDropdown({
        name: "fontFamily",
        displayName: "Font",
        value: FONT_ITEMS[0],
        items: FONT_ITEMS
    });

    labelPositionItems: IEnumMember[] = [
        { value: "inside", displayName: "Inside" },
        { value: "bottom", displayName: "Bottom" },
        { value: "top", displayName: "Top" }
    ];

    labelPosition = new formattingSettings.ItemDropdown({
        name: "labelPosition",
        displayName: "Position",
        value: this.labelPositionItems[0],
        items: this.labelPositionItems
    });

    autoLabelContrast = new formattingSettings.ToggleSwitch({
        name: "autoLabelContrast",
        displayName: "Auto contrast",
        value: true
    });

    showBackground = new formattingSettings.ToggleSwitch({
        name: "showBackground",
        displayName: "Background",
        value: false
    });

    backgroundColor = new formattingSettings.ColorPicker({
        name: "backgroundColor",
        displayName: "Background color",
        value: { value: "#ffffff" }
    });

    backgroundOpacity = new formattingSettings.Slider({
        name: "backgroundOpacity",
        displayName: "Background opacity",
        value: 0.8,
        options: {
            minValue: { type: ValidatorType.Min, value: 0 },
            maxValue: { type: ValidatorType.Max, value: 1 }
        }
    });

    slices = [
        this.showDataLabels,
        this.fontSize,
        this.fontFamily,
        this.labelPosition,
        this.autoLabelContrast,
        this.showBackground,
        this.backgroundColor,
        this.backgroundOpacity
    ];
}

class XAxisCardSettings extends formattingSettings.SimpleCard {
    name = "xAxis";
    displayName = "X axis";
    analyticsPane = false;

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show axis",
        value: true
    });

    title = new formattingSettings.ToggleSwitch({
        name: "title",
        displayName: "Show title",
        value: false
    });

    titleText = new formattingSettings.TextInput({
        name: "titleText",
        displayName: "Title text",
        value: "Budget usage (%)",
        placeholder: "Axis title"
    });

    color = new formattingSettings.ColorPicker({
        name: "color",
        displayName: "Text color",
        value: { value: "#374151" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text size",
        value: 11,
        options: {
            minValue: { type: ValidatorType.Min, value: 8 },
            maxValue: { type: ValidatorType.Max, value: 24 }
        }
    });

    autoScale = new formattingSettings.ToggleSwitch({
        name: "autoScale",
        displayName: "Auto scale",
        value: true
    });

    min = new formattingSettings.NumUpDown({
        name: "min",
        displayName: "Minimum",
        value: 0
    });

    max = new formattingSettings.NumUpDown({
        name: "max",
        displayName: "Maximum",
        value: 1.2
    });

    showGridlines = new formattingSettings.ToggleSwitch({
        name: "showGridlines",
        displayName: "Gridlines",
        value: true
    });

    showTickMarks = new formattingSettings.ToggleSwitch({
        name: "showTickMarks",
        displayName: "Tick marks",
        value: true
    });

    slices = [
        this.show,
        this.title,
        this.titleText,
        this.color,
        this.fontSize,
        this.autoScale,
        this.min,
        this.max,
        this.showGridlines,
        this.showTickMarks
    ];
}

class YAxisCardSettings extends formattingSettings.SimpleCard {
    name = "yAxis";
    displayName = "Y axis";
    analyticsPane = false;

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show axis labels",
        value: true
    });

    positionItems: IEnumMember[] = [
        { value: "left", displayName: "Left" },
        { value: "right", displayName: "Right" }
    ];

    position = new formattingSettings.ItemDropdown({
        name: "position",
        displayName: "Position",
        value: this.positionItems[0],
        items: this.positionItems
    });

    color = new formattingSettings.ColorPicker({
        name: "color",
        displayName: "Text color",
        value: { value: "#374151" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text size",
        value: 12,
        options: {
            minValue: { type: ValidatorType.Min, value: 8 },
            maxValue: { type: ValidatorType.Max, value: 24 }
        }
    });

    slices = [
        this.show,
        this.position,
        this.color,
        this.fontSize
    ];
}

class LegendCardSettings extends formattingSettings.SimpleCard {
    name = "legend";
    displayName = "Legend";
    analyticsPane = false;

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show legend",
        value: true
    });

    legendPositionItems: IEnumMember[] = [
        { value: "top", displayName: "Top" },
        { value: "bottom", displayName: "Bottom" },
        { value: "left", displayName: "Left" },
        { value: "right", displayName: "Right" }
    ];

    position = new formattingSettings.ItemDropdown({
        name: "position",
        displayName: "Position",
        value: this.legendPositionItems[0],
        items: this.legendPositionItems
    });

    titleText = new formattingSettings.TextInput({
        name: "titleText",
        displayName: "Legend title",
        value: "Type",
        placeholder: "Legend title"
    });

    textColor = new formattingSettings.ColorPicker({
        name: "textColor",
        displayName: "Text color",
        value: { value: "#374151" }
    });

    titleColor = new formattingSettings.ColorPicker({
        name: "titleColor",
        displayName: "Title color",
        value: { value: "#111827" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text size",
        value: 11,
        options: {
            minValue: { type: ValidatorType.Min, value: 8 },
            maxValue: { type: ValidatorType.Max, value: 24 }
        }
    });

    fontFamily = new formattingSettings.ItemDropdown({
        name: "fontFamily",
        displayName: "Font",
        value: FONT_ITEMS[0],
        items: FONT_ITEMS
    });

    slices = [
        this.show,
        this.position,
        this.titleText,
        this.textColor,
        this.titleColor,
        this.fontSize,
        this.fontFamily
    ];
}

class NumberFormatCardSettings extends formattingSettings.SimpleCard {
    name = "numberFormat";
    displayName = "Values";
    analyticsPane = false;

    valueDecimals = new formattingSettings.NumUpDown({
        name: "valueDecimals",
        displayName: "Value decimals",
        value: 0,
        options: {
            minValue: { type: ValidatorType.Min, value: 0 },
            maxValue: { type: ValidatorType.Max, value: 6 }
        }
    });

    percentDecimals = new formattingSettings.NumUpDown({
        name: "percentDecimals",
        displayName: "Percent decimals",
        value: 0,
        options: {
            minValue: { type: ValidatorType.Min, value: 0 },
            maxValue: { type: ValidatorType.Max, value: 4 }
        }
    });

    showKCHF = new formattingSettings.ToggleSwitch({
        name: "showKCHF",
        displayName: "Show kCHF suffix",
        value: true
    });

    boldNumbers = new formattingSettings.ToggleSwitch({
        name: "boldNumbers",
        displayName: "Bold numbers",
        value: false
    });

    useFieldDataFormat = new formattingSettings.ToggleSwitch({
        name: "useFieldDataFormat",
        displayName: "Use field data format",
        value: true
    });

    slices = [
        this.valueDecimals,
        this.percentDecimals,
        this.showKCHF,
        this.boldNumbers,
        this.useFieldDataFormat
    ];
}

class TooltipCardSettings extends formattingSettings.SimpleCard {
    name = "tooltips";
    displayName = "Tooltips";
    analyticsPane = false;

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show tooltips",
        value: true
    });

    slices = [this.show];
}

class LayoutCardSettings extends formattingSettings.SimpleCard {
    name = "layout";
    displayName = "Layout";
    analyticsPane = false;

    leftPadding = new formattingSettings.NumUpDown({
        name: "leftPadding",
        displayName: "Left padding",
        value: 6,
        options: {
            minValue: { type: ValidatorType.Min, value: 0 },
            maxValue: { type: ValidatorType.Max, value: 80 }
        }
    });

    rightPadding = new formattingSettings.NumUpDown({
        name: "rightPadding",
        displayName: "Right padding",
        value: 8,
        options: {
            minValue: { type: ValidatorType.Min, value: 0 },
            maxValue: { type: ValidatorType.Max, value: 120 }
        }
    });

    responsive = new formattingSettings.ToggleSwitch({
        name: "responsive",
        displayName: "Responsive behavior",
        value: true
    });

    slices = [this.leftPadding, this.rightPadding, this.responsive];
}

export class VisualSettingsModel extends formattingSettings.Model {
    bulletChart = new BulletChartCardSettings();
    colors = new ColorsCardSettings();
    dataLabels = new DataLabelsCardSettings();
    xAxis = new XAxisCardSettings();
    yAxis = new YAxisCardSettings();
    legend = new LegendCardSettings();
    numberFormat = new NumberFormatCardSettings();
    tooltips = new TooltipCardSettings();
    layout = new LayoutCardSettings();

    cards = [
        this.bulletChart,
        this.colors,
        this.dataLabels,
        this.xAxis,
        this.yAxis,
        this.legend,
        this.numberFormat,
        this.tooltips,
        this.layout
    ];
}
