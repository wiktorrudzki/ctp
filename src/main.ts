import { applyOnColorChange } from "./applyOnColorChange";
import { ChartWrapper } from "./chart";
import { formatData } from "./formatData";
import "./style.css";

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

  const title = document.getElementById("file-title");

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

  const distanceChart = new ChartWrapper({
    elementId: "distance-chart",
    xData: data.map((e) => e[0]),
    yData: data.map((e) => e[1]),
    xTitle: "Czas [s]",
    yTitle: "Odległość [mm]",
    maxNumberOfElementsOnChart,
  });

  // wyswietlenie nazwy wyswietlanego pliku
  if (title) {
    const splitValue = FILE_PATH.split("/");
    const formattedValue = splitValue[splitValue.length - 1];
    title.textContent = formattedValue;
  }

  // if (voltageColorInput) {
  //   applyOnColorChange(voltageColorInput, voltageChart);
  // }

  if (distanceColorInput) {
    applyOnColorChange(distanceColorInput, distanceChart);
  }

  const stopBtn = document.getElementById("stop-chart-btn");
  const startBtn = document.getElementById("start-chart-btn");
  const fileInput = document.getElementById("file-input") as HTMLInputElement;

  // jak klikniemy w zatrzymaj to automatycznie przycisk staje sie disabled
  stopBtn?.addEventListener("click", () => {
    distanceChart.stopInterval();
    stopBtn.setAttribute("disabled", "disabled");
    startBtn?.removeAttribute("disabled");
  });

  // jak klikniemy w wznow wykres to automatycznie staje sie ten przycisk disabled
  startBtn?.addEventListener("click", () => {
    distanceChart.startInterval();
    startBtn.setAttribute("disabled", "disabled");
    stopBtn?.removeAttribute("disabled");
  });

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
    }
    reader.readAsText(file);
  }

  fileInput?.addEventListener("change", function (e) {
    if (e.target) {
      readFile((e.target as any).files[0]);
    }

    // wyswietlenie nazwy pliku
    if (title) {
      const splitValue = fileInput.value.split("\\");
      const formattedValue = splitValue[splitValue.length - 1];
      title.textContent = formattedValue;
    }

    // bez tej linijki, gdybysmy chcieli wczytac jeszcze raz ten sam plik, to metoda onChange sie nie uruchomi bo nazwa pliku sie nie zmienilaby w porownaniu z wartoscia fileInput
    fileInput.value = "";
  });
};

init();
