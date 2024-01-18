// Takes a quantity and name (metric) and will return a pluralised string if appropriate
export const pluralisedQuantity = (qty: number, metric: string) => {
    return `${qty} ${metric}${qty === 1 ? "" : "s"}`
};
