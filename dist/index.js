"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabasePages = void 0;
const fetcher_1 = require("./fetcher");
const transformer_1 = require("./transformer");
const client_1 = require("@notionhq/client");
const path_1 = __importDefault(require("path"));
require("dotenv").config();
const inputFile = path_1.default.join(__dirname, "../notion-pages.json");
const outputFile = path_1.default.join(__dirname, "../content.json");
const getDatabasePages = async (notion, query) => {
    const fetcher = new fetcher_1.NotionDatabaseFetcher(notion);
    await fetcher.setDatabaseIdFromQuery(query);
    const pages = await fetcher.fetchDatabasePages();
    await fetcher.saveToFile(pages);
};
exports.getDatabasePages = getDatabasePages;
const getCommandLineArg = (index) => {
    return process.argv[index] || "";
};
async function main() {
    const query = getCommandLineArg(2);
    if (!query) {
        console.error("Please provide a query as a command line argument");
        process.exit(1);
    }
    const notion = new client_1.Client({ auth: process.env.NOTION_API_KEY });
    // const fetcher = new NotionDatabaseFetcher(notion);
    // await fetcher.setDatabaseIdFromQuery(query);
    // const pages = await fetcher.fetchDatabasePages();
    // await fetcher.saveToFile(pages);
    const transformer = new transformer_1.NotionPageTransformer(inputFile);
    await transformer.loadPages();
    await transformer.saveTransformedPages(outputFile);
}
main();
//# sourceMappingURL=index.js.map