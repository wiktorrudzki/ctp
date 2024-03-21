export const formatData = (res: string): number[][] =>
  res
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) =>
      line.split("\t").map((val) => {
        const parsedVal = parseFloat(val.replace(",", "."));

        if (typeof parsedVal === "number") return parsedVal;

        throw new Error("Some of the values are not numbers");
      })
    );
