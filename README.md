# Power BI Custom Visual: Bullet Chart

Custom Power BI visual (`.pbiviz`) for budget tracking with:
- Actual bars (stacked by legend/fund type)
- Threshold zone and target marker
- Over-budget segment
- Forecast top-up (hatched)
- Tooltips for Actual, Forecast, Over-budget, and Budget target
- Configurable legend position and label formatting

## Project Structure

- `src/visual.ts`: D3 rendering + interactions/tooltips
- `src/settings.ts`: formatting pane model
- `capabilities.json`: data roles + objects exposed to Power BI
- `style/visual.less`: visual styles
- `pbiviz.json`: visual metadata

## Requirements

- Node.js 18+ (recommended)
- npm
- Power BI Visuals Tools (`pbiviz`, installed via `npx`)

## Install

```bash
npm install
```

## Build / Package

```bash
npx pbiviz package --skip-api
```

Generated file:

- `dist/BulletChartLegendA1B2C3D4E5F6G7H8.1.0.0.0.pbiviz`

## Run in Dev Mode

```bash
npx pbiviz start
```

## Import in Power BI Desktop

1. Open Power BI Desktop
2. Visualizations pane > `...` > **Import a visual from a file**
3. Select the generated `.pbiviz` file from `dist/`

## Data Mapping (Fields)

- `Category`: budget category (required)
- `Legend`: series split (optional, e.g. fund type)
- `Actual`: actual amount (required)
- `Target`: budget amount (optional but recommended)
- `Forecast`: forecast amount (optional)

Notes:
- If `Target` is missing, the visual infers a target from max actual.
- Over-budget is shown when `Actual > Target`.
- Forecast top-up is shown when `Forecast > Actual`.

## Key Features Implemented

- Mixed X scale for large overruns:
  - linear up to 100%
  - logarithmic above 100% (prevents graph distortion)
- Over-budget tooltip with % and absolute values
- Forecast tooltip with `Expected` labels
- Legend with color markers and configurable position (top/bottom/left/right)
- Formatting pane options for:
  - decimals (value/percent)
  - unit suffix (`kCHF`) on/off
  - font size
  - bold numbers
  - label visibility, position, and auto-contrast

## Publish to AppSource (Store-ready baseline)

This project packages correctly with `pbiviz`.  
For AppSource submission, ensure you also complete Microsoft validation requirements (accessibility, interactions, context menu, high contrast, etc.).

