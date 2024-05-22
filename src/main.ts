import { ChartWrapper } from "./chart";
import { formatData } from "./formatData";
import "./style.css";
import toastr from "toastr";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

const FILE_PATH = import.meta.env.VITE_FILE_PATH;
const MAX_ELEMENTS = import.meta.env.VITE_MAX_ELEMENTS;

const stopBtn = document.getElementById("stop-chart-btn");
const startBtn = document.getElementById("start-chart-btn");
const exportBtn = document.getElementById("export-chart-btn");

const fileInput = document.getElementById("file-input") as HTMLInputElement;
const distanceColorInput = document.getElementById(
  "distance-color"
) as HTMLInputElement;
// TODO umożliwić zmianę prędkości wykresu
const rangeInput = document.getElementById("range-input") as HTMLInputElement;
const searchXInput = document.getElementById(
  "search-x-input"
) as HTMLInputElement;

let searchByXTimeout: number;

const title = document.getElementById("file-title");
const maxY = document.getElementById("maxY");
const maxX = document.getElementById("maxX");
const minY = document.getElementById("minY");
const minX = document.getElementById("minX");

const hamMenu = document.querySelector(".ham-menu");

const offScreenMenu = document.querySelector(".off-screen-menu");

hamMenu.addEventListener("click", () => {
  hamMenu.classList.toggle("active");
  offScreenMenu.classList.toggle("active");
});
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

  const updateMinMaxValues = () => {
    maxX
      ? (maxX.textContent = distanceChart.max.x.toPrecision(4).toString())
      : null;
    maxY
      ? (maxY.textContent = distanceChart.max.y.toPrecision(4).toString())
      : null;
    minY
      ? (minY.textContent = distanceChart.min.y.toPrecision(4).toString())
      : null;
    minX
      ? (minX.textContent = distanceChart.min.x.toPrecision(4).toString())
      : null;
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
        borderColor: distanceChart.getBorderColor(),
      });
      updateMinMaxValues();
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

  const applyOnColorChange = () => {
    distanceColorInput?.addEventListener("input", (e) => {
      if (e && e.target) {
        distanceChart.updateBorderColor(e.target.value as string);
      }
    });
  };

  const applySearchByX = () => {
    searchXInput?.addEventListener("input", (e) => {
      if (e && e.target) {
        clearTimeout(searchByXTimeout);

        searchByXTimeout = setTimeout(() => {
          // TODO zaaplikować ustawienie wykresy na danym X
          const xData = distanceChart.getXData();

          const value = parseInt(e.target?.value as string);

          const x = xData
            .map((data) => Math.round(data))
            .find((x) => x === value);

          if (x) {
            distanceChart.setSpecificX(x);
            stopChart();
            toastr.success(
              `Ustawiono przedział zmiennych X na: ${x} +/- ${maxElements}`
            );
          } else {
            toastr.warning("Podana wartość nie istnieje dla wczytanych danych");
          }
        }, 750);
      }
    });
  };

  const exportChartToPdf = () =>{
    const chartElement = document.getElementById('distance-chart');
    if(chartElement){
      html2canvas(chartElement).then((element)=>{
        const imgData = element.toDataURL('image/png');
        const pdf = new jsPDF();
        pdf.addImage(imgData, 'PNG', 10, 10, element.width / 4, element.height /4);
        pdf.save('chart.pdf')
      })
    }
  }

  const maxElements = parseInt(MAX_ELEMENTS);

  const maxNumberOfElementsOnChart = maxElements;

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

  applyOnColorChange();

  updateMinMaxValues();

  applySearchByX();

  // jak klikniemy w zatrzymaj to automatycznie przycisk staje sie disabled
  stopBtn?.addEventListener("click", stopChart);

  // jak klikniemy w wznow wykres to automatycznie staje sie ten przycisk disabled
  startBtn?.addEventListener("click", resumeChart);
  // exporting to chart.pdf onClick event
  exportBtn?.addEventListener("click", exportChartToPdf);

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
