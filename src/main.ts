import { ChartWrapper } from './chart';
import { formatData } from './formatData';
import './style.css';
import toastr from 'toastr';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const FILE_PATH = import.meta.env.VITE_FILE_PATH;
const MAX_ELEMENTS = import.meta.env.VITE_MAX_ELEMENTS;
let newButtonContainer: HTMLDivElement;
let formatedData: any;
const exportButtonContainer = document.querySelector('.options.export');
const stopBtn = document.getElementById('stop-chart-btn');
const startBtn = document.getElementById('start-chart-btn');
const exportBtn = document.getElementById('export-chart-btn');

const fileInput = document.getElementById('file-input') as HTMLInputElement;
const distanceColorInput = document.getElementById(
  'distance-color'
) as HTMLInputElement;
// TODO umożliwić zmianę prędkości wykresu
const rangeInput = document.getElementById('range-input') as HTMLInputElement;
const searchXInput = document.getElementById(
  'search-x-input'
) as HTMLInputElement;
const yTitleInput = document.getElementById(
  'y-title-input'
) as HTMLInputElement;
const xTitleInput = document.getElementById(
  'x-title-input'
) as HTMLInputElement;

let searchByXTimeout: number;
let fileContent = '';

const title = document.getElementById('file-title');
const maxY = document.getElementById('maxY');
const maxX = document.getElementById('maxX');
const minY = document.getElementById('minY');
const minX = document.getElementById('minX');

const hamMenu = document.querySelector('.ham-menu');

const offScreenMenu = document.querySelector('.off-screen-menu');

// hamMenu.addEventListener("click", () => {
//   hamMenu.classList.toggle("active");
//   offScreenMenu.classList.toggle("active");
// });

const colorThemes = document.querySelectorAll('[name="theme"]');

const storeTheme = function (theme) {
  localStorage.setItem('theme', theme);
};

const setTheme = function () {
  const activeTheme = localStorage.getItem('theme') || 'light';
  colorThemes.forEach((themeOption) => {
    if (themeOption.id === activeTheme) {
      themeOption.checked = true;
    }
  });

  document.documentElement.className = activeTheme;
};

colorThemes.forEach((themeOption) => {
  themeOption.addEventListener('click', () => {
    storeTheme(themeOption.id);

    document.documentElement.className = themeOption.id;
  });
});

document.onload = setTheme();

const init = () => {
  getDataFromFile();
};

const getDataFromFile = () => {
  fetch(FILE_PATH)
    .then(async (res) => res.text())
    .then((res) => {
      fileContent = res;
      const formattedData = formatData(res);
      formatedData = formatData(res);
      createChart(formattedData);
    });
};

const createChart = (data: number[][]) => {
  const resumeChart = () => {
    distanceChart.startInterval();
    startBtn?.setAttribute('disabled', 'disabled');
    stopBtn?.removeAttribute('disabled');
  };

  const stopChart = () => {
    distanceChart.stopInterval();
    stopBtn?.setAttribute('disabled', 'disabled');
    startBtn?.removeAttribute('disabled');
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
        throw new Error('error');
      }

      fileContent = e.target.result as string;
      const data = formatData(e.target.result as string);
      formatedData = formatData(e.target.result as string);

      // zaktualizowanie wykresu
      distanceChart.update({
        elementId: 'distance-chart',
        xData: data.map((e) => e[0]),
        yData: data.map((e) => e[1]),
        xTitle: 'Czas [s]',
        yTitle: 'Odległość [mm]',
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
      const splitValue = path.split('/');
      const formattedValue = splitValue[splitValue.length - 1];
      title.textContent = formattedValue;
    }
  };

  const applyOnColorChange = () => {
    distanceColorInput?.addEventListener('input', (e) => {
      if (e && e.target) {
        distanceChart.updateBorderColor(e.target.value as string);
      }
    });
  };

  const applyOnAxisTitleChange = () => {
    xTitleInput.addEventListener('input', (e) => {
      if (e && e.target) {
        distanceChart.updateXTitle(e.target.value as string);
      }
    });
    yTitleInput.addEventListener('input', (e) => {
      if (e && e.target) {
        distanceChart.updateYTitle(e.target.value as string);
      }
    });
  };

  const applySearchByX = () => {
    searchXInput?.addEventListener('input', (e) => {
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
            toastr.warning('Podana wartość nie istnieje dla wczytanych danych');
          }
        }, 750);
      }
    });
  };
  const exportChartToPng = () => {
    const chartElement = document.getElementById('distance-chart');
    if (chartElement) {
      html2canvas(chartElement, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'chart.png';
        link.click();
        restoreDefaultButton();
      });
    }
  };

  const exportChartToPdf = () => {
    const chartElement = document.getElementById('distance-chart');
    if (chartElement) {
      html2canvas(chartElement, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'pt',
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('chart.pdf');
        restoreDefaultButton();
      });
    }
  };

  const restoreDefaultButton = () => {
    if (newButtonContainer) {
      while (newButtonContainer.firstChild) {
        newButtonContainer.removeChild(newButtonContainer.firstChild);
      }
    }

    const defaultButton = document.createElement('button');
    defaultButton.id = 'export-chart-btn';
    defaultButton.className = 'buttons';
    defaultButton.innerText = 'Wyeksportuj wykres';

    defaultButton.addEventListener('click', function () {
      const pdfButton = document.createElement('button');
      pdfButton.innerText = 'PDF';
      pdfButton.className = 'buttons';
      pdfButton.addEventListener('click', () => {
        exportChartToPdf();
      });

      const pngButton = document.createElement('button');
      pngButton.innerText = 'PNG';
      pngButton.className = 'buttons';
      pngButton.addEventListener('click', () => {
        exportChartToPng();
      });

      newButtonContainer = document.createElement('div');
      newButtonContainer.appendChild(pdfButton);
      newButtonContainer.appendChild(pngButton);

      exportButtonContainer.innerHTML = '';
      exportButtonContainer.appendChild(newButtonContainer);
    });

    exportButtonContainer.innerHTML = '';
    exportButtonContainer.appendChild(defaultButton);
  };

  const maxElements = parseInt(MAX_ELEMENTS);

  const maxNumberOfElementsOnChart = maxElements;

  const distanceChart = new ChartWrapper({
    elementId: 'distance-chart',
    xData: data.map((e) => e[0]),
    yData: data.map((e) => e[1]),
    xTitle: 'Czas [s]',
    yTitle: 'Odległość [mm]',
    maxNumberOfElementsOnChart,
  });

  // wyswietlenie nazwy wyswietlanego pliku
  displayTitle(FILE_PATH);

  applyOnColorChange();

  applyOnAxisTitleChange();

  updateMinMaxValues();

  applySearchByX();

  document.getElementById('file-review')
    ?.addEventListener('click', function () {
      document.getElementById('popup-1').classList.toggle('active');
      const table = document.createElement('table');

      formatedData.forEach((rowData) => {

        const row = document.createElement('tr');

        rowData.forEach((cellData) => {
          const cell = document.createElement('td');
          cell.textContent = cellData; 
          row.appendChild(cell); 
        });

        
        table.appendChild(row);
      });
      const dataPopUp = document.getElementById('dataPopUp');
      dataPopUp.innerHTML = '';
      dataPopUp.appendChild(table);
    });

  document
    .getElementById('export-chart-btn')
    .addEventListener('click', function () {
      const pdfButton = document.createElement('button');
      pdfButton.innerText = 'PDF';
      pdfButton.className = 'buttons';
      pdfButton.addEventListener('click', () => {
        exportChartToPdf();
      });

      const pngButton = document.createElement('button');
      pngButton.innerText = 'PNG';
      pngButton.className = 'buttons';
      pngButton.addEventListener('click', () => {
        exportChartToPng();
      });

      newButtonContainer = document.createElement('div');
      newButtonContainer.appendChild(pdfButton);
      newButtonContainer.appendChild(pngButton);

      exportButtonContainer.innerHTML = '';
      exportButtonContainer.appendChild(newButtonContainer);
    });

  stopBtn?.addEventListener('click', stopChart);

  startBtn?.addEventListener('click', resumeChart);

  fileInput?.addEventListener('change', function (e) {
    if (e.target) {
      readFile((e.target as any).files[0]);
    }

    if (title) {
      displayTitle(fileInput.value);
    }

    fileInput.value = '';
  });
};

init();
