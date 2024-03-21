import { applyOnColorChange } from "./applyOnColorChange";
import { ChartWrapper } from "./chart";
import { formatData } from "./formatData";

import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

const FILE_PATH = import.meta.env.VITE_FILE_PATH;
const MAX_ELEMENTS = import.meta.env.VITE_MAX_ELEMENTS;

const init = () => {
  getDataFromFile();
};

const getDataFromFile = () => {
  fetch(FILE_PATH)
    .then(async (res) => res.text())
    .then((res) => {
      const formattedData = formatData(res);
      createCharts(formattedData);
    });
};

const createCharts = (data: number[][]) => {
  const maxElements = parseInt(MAX_ELEMENTS);

  const maxNumberOfElementsOnChart = maxElements || 1000;

  const voltageColorInput = document.getElementById("voltage-color");
  const distanceColorInput = document.getElementById("distance-color");

  const voltageChart = new ChartWrapper({
    elementId: "voltage-chart",
    xData: data.map((e) => e[0]),
    yData: data.map((e) => e[2]),
    xTitle: "Czas [s]",
    yTitle: "Napiecie [V]",
    maxNumberOfElementsOnChart,
  });

  const distanceChart = new ChartWrapper({
    elementId: "distance-chart",
    xData: data.map((e) => e[0]),
    yData: data.map((e) => e[1]),
    xTitle: "Czas [s]",
    yTitle: "Odległość [mm]",
    maxNumberOfElementsOnChart,
  });

  if (voltageColorInput) {
    applyOnColorChange(voltageColorInput, voltageChart);
  }

  if (distanceColorInput) {
    applyOnColorChange(distanceColorInput, distanceChart);
  }
};

init();

