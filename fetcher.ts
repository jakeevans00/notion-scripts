import { Client } from "@notionhq/client";
import {
  BlockObjectResponse,
  PageObjectResponse,
  PartialDatabaseObjectResponse,
  PartialPageObjectResponse,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";
import fs from "fs/promises";
import path from "path";

type Block = BlockObjectResponse;

interface PageWithBlocks extends PageObjectResponse {
  children?: Block[];
}

export class NotionDatabaseFetcher {
  private notion: Client;
  private databaseId: string;

  constructor(notion: Client, databaseId?: string) {
    this.notion = notion;
    this.databaseId = databaseId || "df301d30-71d5-47e7-9624-dbc29d81fb36";
  }

  async setDatabaseIdFromQuery(query: string): Promise<void> {
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
    } catch (e) {
      if (e instanceof Error) {
        throw new Error(`Failed to find database: ${e.message}`);
      } else {
        throw new Error(
          "An unknown error occurred while searching for the database"
        );
      }
    }
  }

  async fetchDatabasePages(): Promise<PageWithBlocks[]> {
    if (!this.databaseId) {
      throw new Error(
        "Database ID is not set. Please set it using setDatabaseIdFromQuery() or in the constructor."
      );
    }

    const { results }: QueryDatabaseResponse =
      await this.notion.databases.query({
        database_id: this.databaseId,
      });

    const pagesWithBlocks = await Promise.all(
      results.map(async (page) => {
        if (!this.isFullPage(page)) {
          throw new Error("Received unexpected partial page object");
        }
        const blocks = await this.getBlocksRecursively(page.id);
        return { ...page, children: blocks };
      })
    );

    return pagesWithBlocks;
  }

  private isFullPage(
    page:
      | PageObjectResponse
      | PartialPageObjectResponse
      | PartialDatabaseObjectResponse
  ): page is PageObjectResponse {
    return "properties" in page;
  }

  private async getBlocksRecursively(blockId: string): Promise<Block[]> {
    const { results } = await this.notion.blocks.children.list({
      block_id: blockId,
    });

    const blocksWithChildren: any = await Promise.all(
      results.map(async (block) => {
        if (block) {
          const children = await this.getBlocksRecursively(block.id);
          return { ...block, children };
        }
        return block;
      })
    );

    return blocksWithChildren;
  }

  async saveToFile(
    pages: PageWithBlocks[],
    outputPath: string = "../notion-pages.json"
  ): Promise<void> {
    const fullPath = path.join(__dirname, outputPath);
    await fs.writeFile(fullPath, JSON.stringify(pages, null, 2));
    console.log(`Wrote ${pages.length} pages to ${fullPath}`);
  }
}
