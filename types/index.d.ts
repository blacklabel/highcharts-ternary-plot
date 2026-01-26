import type * as Highcharts from "highcharts";

declare function HighchartsTernaryPlot(H: typeof Highcharts): void;

export = HighchartsTernaryPlot;
export as namespace HighchartsTernaryPlot;

// Highcharts augmentations
declare module "highcharts" {
  interface SeriesTypeRegistry {
    ternaryscatter: Highcharts.Series;
  }
}