"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseId = void 0;
const getDatabaseId = async (notion) => {
    const query = process.argv[2];
    if (!query) {
        console.error("Please provide a query");
        process.exit(1);
    }
    try {
        const response = await notion.search({
            query: query,
            filter: {
                value: "database",
                property: "object",
            },
        });
        return response.results[0].id;
    }
    catch (e) {
        if (e instanceof Error) {
            console.error("Error message", e.message);
        }
        else {
            console.error("An unknown error occured", e);
        }
    }
};
exports.getDatabaseId = getDatabaseId;
//# sourceMappingURL=api-calls.js.map