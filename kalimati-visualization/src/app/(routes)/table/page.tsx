import pl from "nodejs-polars";

export default function DataTable() {
  const df = pl.DataFrame({
    A: [1, 2, 3, 4, 5],
    fruits: ["banana", "banana", "apple", "apple", "banana"],
    B: [5, 4, 3, 2, 1],
    cars: ["beetle", "audi", "beetle", "beetle", "beetle"],
  });

  console.log(df);

  return <div>We will have a data table here.</div>;
}
