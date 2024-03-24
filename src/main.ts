import { applyOnColorChange } from "./applyOnColorChange";
import { ChartWrapper } from "./chart";
import { formatData } from "./formatData";
import "./style.css";

import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

const FILE_PATH = import.meta.env.VITE_FILE_PATH;
const MAX_ELEMENTS = import.meta.env.VITE_MAX_ELEMENTS;

const init = () => {
  
  document.getElementById('file-input').addEventListener('change', (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      
      getDataFromFile(selectedFile);
    }
  });
};



const getDataFromFile = (file:File) => {
  const reader = new FileReader();
  
  reader.onload = async (event) => {
    const fileContent = event.target.result;
    console.log(fileContent);
    const formattedData = formatData(fileContent);
    console.log(formattedData);
    createCharts(formattedData);
  };
  
  reader.readAsText(file);
};

const createCharts = (data: number[][]) => {

  
  /* const previousChartElement = document.getElementById("distance-chart");
  console.log(previousChartElement);
  if (previousChartElement)
  {
    const previousCanvas = previousChartElement as HTMLCanvasElement;
    console.log(previousCanvas);
    const previousChart = Chart.getChart(previousCanvas);
    console.log(previousChart);
    if (previousChart) {
      previousChart.destroy();
    }
    previousChartElement.remove();
  } */
  const maxElements = parseInt(MAX_ELEMENTS);

  const maxNumberOfElementsOnChart = maxElements || 1000;

  // const voltageColorInput = document.getElementById("voltage-color");
  const distanceColorInput = document.getElementById("distance-color");

  // const voltageChart = new ChartWrapper({
  //   elementId: "voltage-chart",
  //   xData: data.map((e) => e[0]),
  //   yData: data.map((e) => e[2]),
  //   xTitle: "Czas [s]",
  //   yTitle: "Napiecie [V]",
  //   maxNumberOfElementsOnChart,
  // });
createCharts
  const distanceChart = new ChartWrapper({
    elementId: "distance-chart",
    xData: data.map((e) => e[0]),
    yData: data.map((e) => e[1]),
    xTitle: "Czas [s]",
    yTitle: "Odległość [mm]",
    maxNumberOfElementsOnChart,
  });

  // if (voltageColorInput) {
  //   applyOnColorChange(voltageColorInput, voltageChart);
  // }

  if (distanceColorInput) {
    applyOnColorChange(distanceColorInput, distanceChart);
  }
};

init();


