import { ChartWrapper } from "./chart";

export const applyOnColorChange = (
  element: HTMLElement,
  chart: ChartWrapper
) => {
  element.addEventListener("input", (e) => {
    if (e && e.target) {
      chart.updateBorderColor(e.target.value as string);
    }
  });
};
