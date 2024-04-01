import { Chart, ChartConfiguration, ChartItem, ChartOptions } from "chart.js";
import { isValidHexaCode } from "./validateHex";

type ChartProperties = {
  elementId: string;
  yData: number[];
  xData: number[];
  xTitle?: string;
  yTitle?: string;
  borderColor?: string;
  maxNumberOfElementsOnChart: number;
};

const defaultColor = "#000";

export class ChartWrapper {
  #element: ChartItem;
  #chart?: Chart;
  #yData: number[];
  #xData: number[];
  #xTitle?: string;
  #yTitle?: string;
  #borderColor?: string;
  #maxElements: number;
  #end: number;
  #interval?: number;

  constructor(args: ChartProperties) {
    const {
      yData,
      xData,
      elementId,
      xTitle,
      yTitle,
      borderColor,
      maxNumberOfElementsOnChart,
    } = args;

    if (yData.length !== xData.length) {
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
    this.#yTitle = yTitle;

    this.#create();
  }

  async #create() {
    const data = {
      labels: this.#xData.slice(0, this.#maxElements),
      datasets: [
        {
          label: this.#yTitle,
          data: this.#yData.slice(0, this.#maxElements),
          fill: false,
          borderColor: this.#borderColor,
          tension: 0.1,
        },
      ],
    };

    const options: ChartOptions = {
      animation: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: this.#yTitle,
          },
          ...this.#getMinAndMax(),
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

  #updateChart() {
    if (!this.#chart) {
      throw new Error("Cannot update chart when it is not defined");
    }

    const { labels, datasets } = this.#chart.data;

    if (labels) {
      labels.shift();
      labels.push(this.#xData[this.#end]);

      for (const dataset of datasets) {
        dataset.data.shift();
        dataset.data.push(this.#yData[this.#end]);
      }

      this.#chart.update();
    }
  }

  update(args: ChartProperties) {
    const {
      yData,
      xData,
      elementId,
      xTitle,
      yTitle,
      borderColor,
      maxNumberOfElementsOnChart,
    } = args;

    if (yData.length !== xData.length) {
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

    console.log("robie robie");

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
    this.#yTitle = yTitle;

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

  stopInterval() {
    clearInterval(this.#interval);
    this.#interval = undefined;
  }

  startInterval() {
    if (!this.#interval)
      this.#interval = setInterval(() => {
        this.#setEndAfterChartFilled();
        this.#updateChart();
      }, 2);
  }

  #setEndAfterChartFilled() {
    if (this.#end < this.#xData.length - 1) {
      this.#end++;
    } else {
      this.#end = 0;
    }
  }

  #getMinAndMax() {
    let min = Infinity;
    let max = -Infinity;

    for (const value of this.#yData) {
      if (value < min) min = value;
      if (value > max) max = value;
    }

    return {
      min: Math.floor(min),
      max: Math.ceil(max),
    };
  }
}
