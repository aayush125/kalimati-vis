"use server";

import pl from "nodejs-polars";

export async function getGroups(groupBy: string) {
  const df = pl.readCSV("data/kalimati_final.csv");
  const commodityCounts = df.groupBy(groupBy).len();

  const labels = commodityCounts.getColumn(groupBy).toArray();
  const values = commodityCounts.getColumn(groupBy + "_count").toArray();

  return { labels, values };
}
