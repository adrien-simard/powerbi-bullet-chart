import powerbi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import ValidatorType = powerbi.visuals.ValidatorType;
import IEnumMember = powerbi.IEnumMember;

class BulletChartCardSettings extends formattingSettings.SimpleCard {
    name = "bulletChart";
    displayName = "Bullet chart";
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

    showLegend = new formattingSettings.ToggleSwitch({
        name: "showLegend",
        displayName: "Show legend",
        value: true
    });

    showCategoryLabels = new formattingSettings.ToggleSwitch({
        name: "showCategoryLabels",
        displayName: "Show category labels",
        value: true
    });

    showDataLabels = new formattingSettings.ToggleSwitch({
        name: "showDataLabels",
        displayName: "Show data labels",
        value: true
    });

    labelPositionItems: IEnumMember[] = [
        { value: "inside", displayName: "Inside" },
        { value: "bottom", displayName: "Bottom" },
        { value: "top", displayName: "Top" }
    ];

    labelPosition = new formattingSettings.ItemDropdown({
        name: "labelPosition",
        displayName: "Bar label position",
        value: this.labelPositionItems[0],
        items: this.labelPositionItems
    });

    autoLabelContrast = new formattingSettings.ToggleSwitch({
        name: "autoLabelContrast",
        displayName: "Auto label contrast",
        value: true
    });

    legendPositionItems: IEnumMember[] = [
        { value: "top", displayName: "Top" },
        { value: "bottom", displayName: "Bottom" },
        { value: "left", displayName: "Left" },
        { value: "right", displayName: "Right" }
    ];

    legendPosition = new formattingSettings.ItemDropdown({
        name: "legendPosition",
        displayName: "Legend position",
        value: this.legendPositionItems[0],
        items: this.legendPositionItems
    });

    slices = [
        this.warningThreshold,
        this.barHeight,
        this.showLegend,
        this.showCategoryLabels,
        this.showDataLabels,
        this.labelPosition,
        this.autoLabelContrast,
        this.legendPosition
    ];
}

class ColorsCardSettings extends formattingSettings.SimpleCard {
    name = "colors";
    displayName = "Colors";
    analyticsPane = false;

    safeColor = new formattingSettings.ColorPicker({
        name: "safeColor",
        displayName: "0-Threshold zone",
        value: { value: "#e5e7eb" }
    });

    warningColor = new formattingSettings.ColorPicker({
        name: "warningColor",
        displayName: "Threshold-Target zone",
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
        displayName: "Text",
        value: { value: "#374151" }
    });

    barLabelColor = new formattingSettings.ColorPicker({
        name: "barLabelColor",
        displayName: "Bar label color",
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

class NumberFormatCardSettings extends formattingSettings.SimpleCard {
    name = "numberFormat";
    displayName = "Number format";
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

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Font size",
        value: 12,
        options: {
            minValue: { type: ValidatorType.Min, value: 8 },
            maxValue: { type: ValidatorType.Max, value: 24 }
        }
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
        this.fontSize,
        this.boldNumbers,
        this.useFieldDataFormat
    ];
}

export class VisualSettingsModel extends formattingSettings.Model {
    bulletChart = new BulletChartCardSettings();
    colors = new ColorsCardSettings();
    numberFormat = new NumberFormatCardSettings();

    cards = [this.bulletChart, this.colors, this.numberFormat];
}
