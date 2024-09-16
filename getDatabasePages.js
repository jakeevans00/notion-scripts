const { Client } = require("@notionhq/client");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.DATABASE_ID;

async function getBlocks(block_id) {
    console.log('get Blocks', block_id)
    let { results: children } = await notion.blocks.children.list({ block_id: block_id });
    for (const child of children) {
        child.children = await getBlocks(child.id);
    }
    return children;
}

(async (databaseId) => {

    let { results: pages } = await notion.databases.query({
        database_id: databaseId,
    });

    for (const page of pages) {
        const blocks = await getBlocks(page.id);
        page.children = blocks;
    }

    const outputFile = path.join(__dirname, "notion-pages.json");
    fs.writeFileSync(outputFile, JSON.stringify(pages, null, 2));
    console.log(`Wrote ${pages.length} pages to ${outputFile}`);
})(databaseId);
