import { Chart, ChartConfiguration, ChartItem, ChartOptions } from "chart.js";
import { isValidHexaCode } from "./validateHex";
import toastr from "toastr";

type ChartProperties = {
  elementId: string;
  yData: Y[];
  xData: number[];
  xTitle?: string;
  borderColor?: string;
  maxNumberOfElementsOnChart: number;
};

type Y = { title: string; values: number[] };

type Point = { y: number; x: number };

const defaultColor = "#000";

export class ChartWrapper {
  #element: ChartItem;
  #chart?: Chart;
  #yData: Y[];
  #xData: number[];
  #xTitle?: string;
  #borderColor?: string;
  #maxElements: number;
  #end: number;
  #interval?: number;
  max: Point[];
  min: Point[];
  #intervalTime = 2;

  constructor(args: ChartProperties) {
    const {
      yData,
      xData,
      elementId,
      xTitle,
      borderColor,
      maxNumberOfElementsOnChart,
    } = args;

    const yLengths = yData.map((data) => data.values.length);

    const minYLength = Math.min(...yLengths);
    const maxYLength = Math.max(...yLengths);

    if (minYLength !== maxYLength) {
      throw new Error("Lengths of datasets are not equal");
    }

    if (minYLength !== xData.length) {
      throw new Error(
        "Data on X axis must be the same length as data on Y axis"
      );
    }

    const element = document.getElementById(elementId) as ChartItem;

    if (!element) {
      throw new Error("Wrong element id provided. Element does not exist");
    }

    if (borderColor && isValidHexaCode(borderColor)) {
      this.#borderColor = borderColor;
    } else {
      this.#borderColor = defaultColor;
    }

    this.#element = element;
    this.#xData = xData;
    this.#yData = yData;
    this.#maxElements = maxNumberOfElementsOnChart;
    this.#end = maxNumberOfElementsOnChart;
    this.#xTitle = xTitle;

    let min: Point[] = [];
    let max: Point[] = [];

    yData.forEach((data) => {
      min.push(this.#getBoundaryValues(xData, data.values, "max"));
      max.push(this.#getBoundaryValues(xData, data.values, "min"));
    });

    this.min = min;
    this.max = max;

    this.#create();
  }

  getXData() {
    return this.#xData;
  }

  #getBoundaryValues(
    xData: number[],
    yData: number[],
    type: "min" | "max" = "max"
  ): { x: number; y: number } {
    if (type === "max") {
      const maxY = Math.max(...yData);
      const maxYIndex = yData.findIndex((data) => data === maxY);

      return { y: maxY, x: xData.find((_, i) => i === maxYIndex) as number };
    } else {
      const minY = Math.min(...yData);
      const minYIndex = yData.findIndex((data) => data === minY);

      return { y: minY, x: xData.find((_, i) => i === minYIndex) as number };
    }
  }

  #setMinAndMaxValues(xData: number[], yData: Y[]) {
    let min: Point[] = [];
    let max: Point[] = [];

    yData.forEach((data) => {
      min.push(this.#getBoundaryValues(xData, data.values, "max"));
      max.push(this.#getBoundaryValues(xData, data.values, "min"));
    });

    this.min = min;
    this.max = max;
  }

  async #create() {
    const data = {
      labels: this.#xData.slice(0, this.#maxElements),
      datasets: this.#yData.map((data) => ({
        label: data.title,
        data: data.values.slice(0, this.#maxElements),
        fill: false,
        borderColor: this.#borderColor,
        tension: 0.1,
      })),
    };

    const options: ChartOptions = {
      animation: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Wartości",
          },
          ...this.getMinAndMax(),
        },
        x: {
          title: {
            display: true,
            text: this.#xTitle,
          },
          ticks: {
            maxTicksLimit: 10,
          },
        },
      },
    };

    const config: ChartConfiguration = {
      type: "line",
      data,
      options,
    };

    this.#chart = new Chart(this.#element, config);
    this.startInterval();
  }

  #updateChartByLabel(x: number) {
    if (!this.#chart) {
      throw new Error("Cannot update chart when it is not defined");
    }

    const halfOfMaxElements = Math.round(this.#maxElements / 2);

    const data = {
      labels: this.#xData.slice(x - halfOfMaxElements, x + halfOfMaxElements),
      datasets: this.#yData.map((data) => ({
        label: data.title,
        data: data.values.slice(0, this.#maxElements),
        fill: false,
        borderColor: this.#borderColor,
        tension: 0.1,
      })),
    };

    this.#chart.data = data;

    this.#chart.update();
  }

  #updateChart() {
    if (!this.#chart) {
      throw new Error("Cannot update chart when it is not defined");
    }

    const { labels, datasets } = this.#chart.data;

    if (labels) {
      labels.shift();
      labels.push(this.#xData[this.#end]);

      datasets.forEach((dataset, index) => {
        dataset.data.shift();
        dataset.data.push(this.#yData[index].values[this.#end]);
      });

      this.#chart.update();
    }
  }

  getBorderColor() {
    return this.#borderColor;
  }

  update(args: ChartProperties) {
    const {
      yData,
      xData,
      elementId,
      xTitle,
      borderColor,
      maxNumberOfElementsOnChart,
    } = args;

    const yLengths = yData.map((data) => data.values.length);

    const minYLength = Math.min(...yLengths);
    const maxYLength = Math.max(...yLengths);

    console.log(this.#yData, "\n\n", this.#xData, "\n\n", yData, "\n\n", xData);

    if (minYLength !== maxYLength) {
      throw new Error("Lengths of datasets are not equal");
    }

    if (minYLength !== xData.length) {
      throw new Error(
        "Data on X axis must be the same length as data on Y axis"
      );
    }

    const element = document.getElementById(elementId) as ChartItem;

    if (!element) {
      throw new Error("Wrong element id provided. Element does not exist");
    }

    this.#chart?.destroy();
    this.stopInterval();

    if (borderColor && isValidHexaCode(borderColor)) {
      this.#borderColor = borderColor;
    } else {
      this.#borderColor = defaultColor;
    }

    this.#element = element;
    this.#xData = xData;
    this.#yData = yData;
    this.#maxElements = maxNumberOfElementsOnChart;
    this.#end = maxNumberOfElementsOnChart;
    this.#xTitle = xTitle;

    this.#setMinAndMaxValues(xData, yData);

    this.#create();
  }

  updateBorderColor(color: string) {
    if (isValidHexaCode(color) && this.#chart) {
      this.#borderColor = color;
      this.#chart.data.datasets = [
        { ...this.#chart?.data.datasets[0], borderColor: color },
      ];
    } else {
      console.error("Wrong color provided: " + color);
    }
  }

  updateXTitle(title: string) {
    if (!this.#chart) {
      throw new Error("Cannot update chart when it is not defined");
    }

    if (title === "") {
      this.#xTitle = "Czas [s]";
      this.#chart.options.scales.x.title.text = "Czas [s]";
    } else {
      this.#xTitle = title;
      this.#chart.options.scales.x.title.text = title;
    }

    this.#chart?.update();
  }

  getXTitle() {
    return this.#xTitle;
  }

  updateYTitle(index: number, title: string) {
    if (!this.#chart) {
      throw new Error("Cannot update chart when it is not defined");
    }

    this.#chart.data.datasets[index].label = title;

    this.#chart.update();
  }

  stopInterval() {
    clearInterval(this.#interval);
    this.#interval = undefined;
  }

  startInterval() {
    this.stopInterval();
    if (!this.#interval)
      this.#interval = setInterval(() => {
        this.#setEndAfterChartFilled();
        this.#updateChart();
      }, this.#intervalTime);
  }

  setUpdateIntervalTime(newIntervalTime: any) {
    this.#intervalTime = newIntervalTime;
    this.startInterval();
  }

  setSpecificX(x: number) {
    const index = this.#xData
      .map((x) => Math.round(x))
      .findIndex((e) => e === x);

    this.#updateChartByLabel(index);
  }

  #setEndAfterChartFilled() {
    if (this.#end < this.#xData.length - 1) {
      this.#end++;
    } else {
      this.#end = 0;
    }
  }
  
  getMinAndMax() {
    let min = Infinity;
    let max = -Infinity;

    for (const dataset of this.#yData) {
      for (const value in dataset.values) {
        const val = parseInt(value);

        if (val < min) min = val;
        if (val > max) max = val;
      }
    }

    return {
      min: Math.floor(min),
      max: Math.ceil(max),
    };
  }

  updateMaxYValue(value: number) {
    this.#chart.options.scales.y.max = value;

    this.#chart?.update();
  }

  getNumberOfDatasets() {
    return this.#yData.length;
  }

  getDataTitles() {
    return this.#chart?.data.datasets.map((dataset) => dataset.label);
  }

  getData() {
    return this.#yData.map((data) => data.values);
  }

  addDataset(dataset: number[], title: string) {
    if (!this.#chart) return;

    this.#yData = [...this.#yData, { title, values: dataset }];
    this.#chart.data.datasets = this.#yData.map((data) => ({
      label: data.title,
      data: data.values.slice(0, this.#maxElements),
      fill: false,
      borderColor: this.#borderColor,
      tension: 0.1,
    }));

    this.#chart?.update();
  }
}
