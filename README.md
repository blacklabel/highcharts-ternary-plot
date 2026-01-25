# Ternary Plot – Highcharts Plugin

[![npm version](https://img.shields.io/npm/v/highcharts-ternary-plot)](https://www.npmjs.com/package/highcharts-ternary-plot)

**Ternary Plot** is an official [Black Label](https://blacklabel.net/highcharts/) plugin for Highcharts, extending the charting library with support for ternary charts used to visualize data composed of three interdependent values that sum to a constant (typically 100%). Each data point represents a composition of three components and is plotted within a triangular coordinate system, making it easy to compare proportions and relationships between them. The plugin is built as a separate add-on to the Highcharts library, owned and maintained by Highsoft AS.

This module is the result of our long-standing collaboration with Highsoft, where we’ve been a trusted partner since 2010 — helping build, maintain, and expand the Highcharts ecosystem. With Ternary Plot, you can easily present complex three-component datasets in a clear and interactive way, without relying on custom implementations or workarounds.

➖ [Live demo](https://blacklabel.github.io/ternary_plot/)  
➖ [GitHub repository](https://github.com/blacklabel/ternary_plot)

![Demo](assets/docs/demo-image.png)
---

## Table of Contents
- [Getting Started](#getting-started)
  - [Compatibility](#compatibility)
  - [Installation](#installation)
- [Usage](#usage)
- [Available Options](#available-options)
- [Development Setup](#development-setup)
- [Using the Plugin Locally in index.html](#using-the-plugin-locally-in-indexhtml)

## Getting Started

### Compatibility

| Ternary Plot Version | Highcharts Version |
| -------------------- | ------------------ |
| **1.0.0**            | `>= 12.0.0`        |

## Installation

Install via NPM:

```bash
npm install highcharts highcharts-ternary-plot
# or
yarn add highcharts highcharts-ternary-plot
# or
pnpm add highcharts highcharts-ternary-plot
```

Then import and initialize:
```js
import Highcharts from "highcharts";
import HighchartsTernaryPlot from "highcharts-ternary-plot";

HighchartsTernaryPlot(Highcharts);
```

Or include via a `<script>` tag after loading Highcharts:
```js
<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://blacklabel.github.io/ternary_plot/js/ternary-plot.js"></script>
```

## Usage

Enable `chart.ternary` and add a `ternaryscatter` series with three-dimensional data:
```js
Highcharts.chart('container', {

  chart: {
    ternary: true
  },

  series: [{
    type: 'ternaryscatter',
    data: [
      [20, 70, 10],
      [30, 40, 30],
      [20, 35, 45],
      [15, 35, 50],
      [20, 20, 60],
      [0, 100, 0]
    ]
  }]

});
```

## Available Options
| Option                 | Type      | Description                              |
| ---------------------- | --------- | ---------------------------------------- |
| `chart.ternary`        | `Boolean` | Whether to enable ternary chart mode.    |
| `chart.ternarySpacing` | `Number`  | The spacing around the ternary plot.     |
| `ternaryAxis`          | `Array`   | An array of ternary axis configurations. |

## Development Setup

If you want to work on this plugin locally:

1. Clone the repository
```bash
git clone https://github.com/blacklabel/ternary_plot.git
cd ternary_plot
```
2. Install dependencies
```bash
npm install
# or
yarn install
```
3. Start a local dev server
```bash
npm start
```
This will launch a local server (via http-server or similar) and open the demo page in your browser.

4. Build the plugin
```bash
npm run build
```
The compiled file will be available in the dist/ folder.

## Using the Plugin Locally in index.html
After building, include the plugin file after Highcharts in your index.html:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Highcharts Ternary Plot - Local Dev</title>
  <script src="https://code.highcharts.com/highcharts.js"></script>
  <script src="dist/ternary_plot.js"></script>
</head>
<body>
  <div id="container"></div>
  <script>
    Highcharts.chart('container', {

    chart: {
      ternary: true
    },

    series: [{
      type: 'ternaryscatter',
      data: [
        [20, 70, 10],
        [30, 40, 30],
        [20, 35, 45],
        [15, 35, 50],
        [20, 20, 60],
        [0, 100, 0]
      ]
    }]

  });
  </script>
</body>
</html>
```

## Why Black Label Built This Plugin

At Black Label, we specialize in pushing the boundaries of data visualization. Over the past 15 years, we’ve worked with companies worldwide to build charting solutions that go beyond out-of-the-box libraries.

Highcharts is at the heart of much of our work, and this plugin grew directly out of real-world client needs:

- Visualizing compositional data using ternary charts  
- Extending Highcharts with native ternary axes and series types

**Ternary Plot** is one of many plugins we’ve created to make Highcharts more flexible, more powerful, and more developer-friendly.


## About Black Label

We’re a Krakow-based team of data visualization experts, working closely with Highsoft and the global Highcharts community since 2010. Our expertise spans plugins, extensions, custom dashboards, and full-scale dataviz applications.

Ternary Plot is just one of the many innovations we’ve open-sourced. Explore more on our [GitHub profile](https://github.com/blacklabel), read insights on our [Blog](https://blacklabel.net/blog/), or connect with us at **tech@blacklabel.net** to discuss how we can help bring your charts and dashboards to life.  

➖ Learn more on our [LinkedIn page](https://www.linkedin.com/company/black-label).
