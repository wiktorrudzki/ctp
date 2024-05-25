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
  max: { y: number; x: number };
  min: { y: number; x: number };

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

    this.max = this.#getBoundaryValues(xData, yData, "max");
    this.min = this.#getBoundaryValues(xData, yData, "min");

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

  #setMinAndMaxValues(xData: number[], yData: number[]) {
    this.max = this.#getBoundaryValues(xData, yData, "max");
    this.min = this.#getBoundaryValues(xData, yData, "min");
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

  #updateChartByLabel(x: number) {
    if (!this.#chart) {
      throw new Error("Cannot update chart when it is not defined");
    }

    const halfOfMaxElements = Math.round(this.#maxElements / 2);

    const data = {
      labels: this.#xData.slice(x - halfOfMaxElements, x + halfOfMaxElements),
      datasets: [
        {
          label: this.#yTitle,
          data: this.#yData.slice(x - halfOfMaxElements, x + halfOfMaxElements),
          fill: false,
          borderColor: this.#borderColor,
          tension: 0.1,
        },
      ],
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

      for (const dataset of datasets) {
        dataset.data.shift();
        dataset.data.push(this.#yData[this.#end]);
      }

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

  updateYTitle(title: string) {
    if (!this.#chart) {
      throw new Error("Cannot update chart when it is not defined");
    }

    if (title === "") {
      this.#yTitle = "Odległość [mm]";
      this.#chart.options.scales.y.title.text = "Odległość [mm]";
      this.#chart.data.datasets[0].label = "Odległość [mm]";
    } else {
      this.#yTitle = title;
      this.#chart.options.scales.y.title.text = title;
      this.#chart.data.datasets[0].label = title;
    }

    this.#chart?.update();
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

  // public setSpecificX(x: number): void {
  //   const index = this.#xData.map((data) => Math.round(data)).indexOf(x);
  //   if (index !== -1) {
  //     this.#end = index;
  //     this.#updateChart();
  //   } else {
  //     console.error(`Value ${x} not found in xData`);
  //   }
  // }
}
