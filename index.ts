import { NotionDatabaseFetcher } from "./fetcher";
import { NotionPageTransformer } from "./transformer";
import { Client } from "@notionhq/client";
import path from "path";

require("dotenv").config();

const inputFile = path.join(__dirname, "../notion-pages.json");
const outputFile = path.join(__dirname, "../content.json");

export const getDatabasePages = async (
  notion: Client,
  query: string
): Promise<void> => {
  const fetcher = new NotionDatabaseFetcher(notion);
  await fetcher.setDatabaseIdFromQuery(query);
  const pages = await fetcher.fetchDatabasePages();
  await fetcher.saveToFile(pages);
};

const getCommandLineArg = (index: number): string => {
  return process.argv[index] || "";
};

async function main() {
  const query = getCommandLineArg(2);
  if (!query) {
    console.error("Please provide a query as a command line argument");
    process.exit(1);
  }

  const notion = new Client({ auth: process.env.NOTION_API_KEY });

  const fetcher = new NotionDatabaseFetcher(notion);
  await fetcher.setDatabaseIdFromQuery(query);
  const pages = await fetcher.fetchDatabasePages();
  await fetcher.saveToFile(pages);

  const transformer = new NotionPageTransformer(inputFile);
  await transformer.loadPages();
  await transformer.saveTransformedPages(outputFile);
}

main();
