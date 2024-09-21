"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotionDatabaseFetcher = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class NotionDatabaseFetcher {
    notion;
    databaseId;
    constructor(notion, databaseId) {
        this.notion = notion;
        this.databaseId = databaseId || "df301d30-71d5-47e7-9624-dbc29d81fb36";
    }
    async setDatabaseIdFromQuery(query) {
        try {
            const response = await this.notion.search({
                query: query,
                filter: {
                    value: "database",
                    property: "object",
                },
            });
            if (response.results.length === 0) {
                throw new Error("No database found with the given query");
            }
            this.databaseId = response.results[0].id;
        }
        catch (e) {
            if (e instanceof Error) {
                throw new Error(`Failed to find database: ${e.message}`);
            }
            else {
                throw new Error("An unknown error occurred while searching for the database");
            }
        }
    }
    async fetchDatabasePages() {
        if (!this.databaseId) {
            throw new Error("Database ID is not set. Please set it using setDatabaseIdFromQuery() or in the constructor.");
        }
        const { results } = await this.notion.databases.query({
            database_id: this.databaseId,
        });
        const pagesWithBlocks = await Promise.all(results.map(async (page) => {
            if (!this.isFullPage(page)) {
                throw new Error("Received unexpected partial page object");
            }
            const blocks = await this.getBlocksRecursively(page.id);
            return { ...page, children: blocks };
        }));
        return pagesWithBlocks;
    }
    isFullPage(page) {
        return "properties" in page;
    }
    async getBlocksRecursively(blockId) {
        const { results } = await this.notion.blocks.children.list({
            block_id: blockId,
        });
        const blocksWithChildren = await Promise.all(results.map(async (block) => {
            if (block) {
                const children = await this.getBlocksRecursively(block.id);
                return { ...block, children };
            }
            return block;
        }));
        return blocksWithChildren;
    }
    async saveToFile(pages, outputPath = "../notion-pages.json") {
        const fullPath = path_1.default.join(__dirname, outputPath);
        await promises_1.default.writeFile(fullPath, JSON.stringify(pages, null, 2));
        console.log(`Wrote ${pages.length} pages to ${fullPath}`);
    }
}
exports.NotionDatabaseFetcher = NotionDatabaseFetcher;
//# sourceMappingURL=fetcher.js.map