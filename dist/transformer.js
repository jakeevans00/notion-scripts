"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotionPageTransformer = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const common_1 = __importDefault(require("highlight.js/lib/common"));
class NotionPageTransformer {
    inputFile;
    pages = [];
    constructor(inputFile) {
        this.inputFile = inputFile;
    }
    async loadPages() {
        try {
            const data = await promises_1.default.readFile(this.inputFile, "utf8");
            this.pages = JSON.parse(data);
        }
        catch (error) {
            console.error(`Error reading file ${this.inputFile}: ${error}`);
            process.exit(1);
        }
    }
    resolveTabs(tabsBlocks) {
        return tabsBlocks
            .filter((tab) => tab.type === "callout")
            .map((tab) => ({
            label: tab.callout.rich_text
                .map(({ plain_text }) => plain_text)
                .join(""),
            text: tab.children[0].paragraph.rich_text
                .map(({ plain_text }) => plain_text)
                .join(""),
        }));
    }
    resolveCalloutComponent(block) {
        if (block.callout?.icon?.type !== "external") {
            console.log("ICON NOT SUPPORTED:", block.callout.icon);
            return null;
        }
        const iconName = block.callout.icon.external.url
            .split("/")
            .pop()
            ?.split(".")[0]
            .split("_")[0];
        const calloutHandler = this.calloutMap[iconName];
        if (!calloutHandler) {
            console.log("EXTERNAL ICON NOT SUPPORTED:", iconName);
            return null;
        }
        return calloutHandler(block);
    }
    highlightCode(code, language) {
        return common_1.default.highlight(code, { language }).value;
    }
    transformBlocks(blocks) {
        return blocks
            .map((block) => {
            console.log(block.type);
            const blockHandler = this.blockMap[block.type];
            if (blockHandler) {
                return blockHandler(block);
            }
            console.log("NOT SUPPORTED:", block.type);
            return null;
        })
            .filter(Boolean);
    }
    transformPages() {
        return this.pages.map((page) => {
            const { properties, children, id, icon } = page;
            return {
                id,
                dateCreated: properties.DateCreated.date.start,
                icon: icon.emoji,
                title: properties.Name.title[0].text.content,
                description: properties.Description.rich_text[0].plain_text,
                urlPath: properties.Slug.rich_text[0].plain_text,
                tags: properties.Tags.multi_select.map(({ name }) => name),
                blocks: this.transformBlocks(children),
            };
        });
    }
    async saveTransformedPages(outputFile) {
        const transformedPages = this.transformPages();
        await promises_1.default.writeFile(outputFile, JSON.stringify(transformedPages, null, 2));
        console.log(`Transformed ${transformedPages.length} pages to ${outputFile}`);
    }
    calloutMap = {
        tabs: (block) => ({
            component: "Tabs",
            tabs: this.resolveTabs(block.children),
        }),
        code: (block) => {
            if (!block.children[0].code) {
                console.log("Code component must be first child of code callout");
                return null;
            }
            const code = block.children[0].code.rich_text
                .map(({ plain_text }) => plain_text)
                .join("");
            const language = block.children[0].code.language;
            return {
                component: "CodeBlock",
                filename: block.callout.rich_text
                    .map(({ plain_text }) => plain_text)
                    .join(""),
                code: this.highlightCode(code, language),
                language: language,
            };
        },
    };
    blockMap = {
        callout: (block) => this.resolveCalloutComponent(block),
        paragraph: (block) => block.paragraph.rich_text.length >= 1
            ? {
                component: "Paragraph",
                text: block.paragraph.rich_text
                    .map(({ plain_text }) => plain_text)
                    .join(""),
            }
            : null,
        code: (block) => {
            const code = block.code.rich_text
                .map(({ plain_text }) => plain_text)
                .join("");
            const language = block.code.language;
            return {
                component: "CodeBlock",
                code: this.highlightCode(code, language),
                language: language,
            };
        },
        heading_1: (block) => ({
            component: "Heading1",
            text: block.heading_1.rich_text[0].plain_text,
        }),
        heading_2: (block) => ({
            component: "Heading2",
            text: block.heading_2.rich_text[0].plain_text,
        }),
        heading_3: (block) => ({
            component: "Heading3",
            text: block.heading_3.rich_text[0].plain_text,
        }),
        bulleted_list_item: (block) => ({
            component: "BulletedListItem",
            text: block.bulleted_list_item.rich_text[0].plain_text,
        }),
        numbered_list_item: (block) => block.numbered_list_item.rich_text.length
            ? {
                component: "NumberedListItem",
                text: block.numbered_list_item.rich_text
                    .map(({ plain_text }) => plain_text)
                    .join(""),
            }
            : null,
        image: (block) => {
            console.log("in image", block.image.file.url);
            return {
                component: "Image",
                text: "",
                url: block.image.file.url,
            };
        },
    };
}
exports.NotionPageTransformer = NotionPageTransformer;
//# sourceMappingURL=transformer.js.map