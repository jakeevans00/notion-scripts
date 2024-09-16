const { Client } = require("@notionhq/client");
require("dotenv").config();


console.log(process.argv);
const query = process.argv[2];
if (!query) {
    console.error("Please provide a query");
    process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });

(async (query) => {
    const response = await notion.search({
        query: query,
        filter: {
            value: "database",
            property: "object"

        }
    });
    console.log(response.results[0].title[0].plain_text);
    console.log(response);
})(query);


