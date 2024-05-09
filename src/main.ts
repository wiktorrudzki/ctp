import { applyOnColorChange } from "./applyOnColorChange";
import { ChartWrapper } from "./chart";
import { formatData } from "./formatData";
import "./style.css";

import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

const FILE_PATH = import.meta.env.VITE_FILE_PATH;
const MAX_ELEMENTS = import.meta.env.VITE_MAX_ELEMENTS;

const stopBtn = document.getElementById("stop-chart-btn");
const startBtn = document.getElementById("start-chart-btn");
const fileInput = document.getElementById("file-input") as HTMLInputElement;

const title = document.getElementById("file-title");

const distanceColorInput = document.getElementById("distance-color");

const init = () => {
  getDataFromFile();
};

const getDataFromFile = () => {
  fetch(FILE_PATH)
    .then(async (res) => res.text())
    .then((res) => {
      const formattedData = formatData(res);
      createChart(formattedData);
    });
};

const createChart = (data: number[][]) => {
  const resumeChart = () => {
    distanceChart.startInterval();
    startBtn?.setAttribute("disabled", "disabled");
    stopBtn?.removeAttribute("disabled");
  };

  const stopChart = () => {
    distanceChart.stopInterval();
    stopBtn?.setAttribute("disabled", "disabled");
    startBtn?.removeAttribute("disabled");
  };

  function readFile(file: Blob) {
    const reader = new FileReader();

    reader.onload = readSuccess;

    function readSuccess(e: ProgressEvent<FileReader>) {
      if (!e.target) {
        // jakies byle co wrzucilem na razie
        throw new Error("error");
      }

      const data = formatData(e.target.result as string);

      // zaktualizowanie wykresu
      distanceChart.update({
        elementId: "distance-chart",
        xData: data.map((e) => e[0]),
        yData: data.map((e) => e[1]),
        xTitle: "Czas [s]",
        yTitle: "Odległość [mm]",
        maxNumberOfElementsOnChart,
      });
      resumeChart();
    }
    reader.readAsText(file);
  }

  const displayTitle = (path: string) => {
    if (title) {
      const splitValue = path.split("/");
      const formattedValue = splitValue[splitValue.length - 1];
      title.textContent = formattedValue;
    }
  };

  const maxElements = parseInt(MAX_ELEMENTS);

  const maxNumberOfElementsOnChart = maxElements || 1000;

  const distanceChart = new ChartWrapper({
    elementId: "distance-chart",
    xData: data.map((e) => e[0]),
    yData: data.map((e) => e[1]),
    xTitle: "Czas [s]",
    yTitle: "Odległość [mm]",
    maxNumberOfElementsOnChart,
  });

  // wyswietlenie nazwy wyswietlanego pliku
  displayTitle(FILE_PATH);

  if (distanceColorInput) {
    applyOnColorChange(distanceColorInput, distanceChart);
  }

  // jak klikniemy w zatrzymaj to automatycznie przycisk staje sie disabled
  stopBtn?.addEventListener("click", stopChart);

  // jak klikniemy w wznow wykres to automatycznie staje sie ten przycisk disabled
  startBtn?.addEventListener("click", resumeChart);

  fileInput?.addEventListener("change", function (e) {
    if (e.target) {
      readFile((e.target as any).files[0]);
    }

    // wyswietlenie nazwy pliku
    if (title) {
      displayTitle(fileInput.value);
    }

    // bez tej linijki, gdybysmy chcieli wczytac jeszcze raz ten sam plik, to metoda onChange sie nie uruchomi bo nazwa pliku sie nie zmienilaby w porownaniu z wartoscia fileInput
    fileInput.value = "";
  });
};

init();
