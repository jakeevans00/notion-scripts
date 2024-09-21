import fs from "fs/promises";
import hljs from "highlight.js/lib/common";

interface NotionBlock {
  type: string;
  [key: string]: any;
}

interface NotionPage {
  id: string;
  created_time: string;
  icon: { emoji: string };
  properties: {
    Name: { title: [{ text: { content: string } }] };
    Description: { rich_text: [{ plain_text: string }] };
    DateCreated: { date: { start: string } };
    Slug: { rich_text: [{ plain_text: string }] };
    Tags: { multi_select: [{ name: string }] };
  };
  children: NotionBlock[];
}

interface TransformedPage {
  id: string;
  dateCreated: string;
  icon: string;
  title: string;
  description: string;
  urlPath: string;
  tags: string[];
  blocks: any[]; // This could be further typed if the structure is consistent
}

interface Tab {
  label: string;
  text: string;
}

type CalloutHandler = (block: NotionBlock) => any;
type BlockHandler = (block: NotionBlock) => any;

export class NotionPageTransformer {
  private pages: NotionPage[] = [];

  constructor(private inputFile: string) {}

  async loadPages(): Promise<void> {
    try {
      const data = await fs.readFile(this.inputFile, "utf8");
      this.pages = JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${this.inputFile}: ${error}`);
      process.exit(1);
    }
  }

  private resolveTabs(tabsBlocks: NotionBlock[]): Tab[] {
    return tabsBlocks
      .filter((tab) => tab.type === "callout")
      .map((tab) => ({
        label: tab.callout.rich_text
          .map(({ plain_text }: { plain_text: string }) => plain_text)
          .join(""),
        text: tab.children[0].paragraph.rich_text
          .map(({ plain_text }: { plain_text: string }) => plain_text)
          .join(""),
      }));
  }

  private resolveCalloutComponent(block: NotionBlock): any {
    if (block.callout?.icon?.type !== "external") {
      console.log("ICON NOT SUPPORTED:", block.callout.icon);
      return null;
    }

    const iconName = block.callout.icon.external.url
      .split("/")
      .pop()
      ?.split(".")[0]
      .split("_")[0];
    const calloutHandler =
      this.calloutMap[iconName as keyof typeof this.calloutMap];

    if (!calloutHandler) {
      console.log("EXTERNAL ICON NOT SUPPORTED:", iconName);
      return null;
    }

    return calloutHandler(block);
  }

  private highlightCode(code: string, language: string): string {
    return hljs.highlight(code, { language }).value;
  }

  private transformBlocks(blocks: NotionBlock[]): any[] {
    return blocks
      .map((block) => {
        const blockHandler =
          this.blockMap[block.type as keyof typeof this.blockMap];
        if (blockHandler) {
          return blockHandler(block);
        }
        console.log("NOT SUPPORTED:", block.type);
        return null;
      })
      .filter(Boolean);
  }

  transformPages(): TransformedPage[] {
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

  async saveTransformedPages(outputFile: string): Promise<void> {
    const transformedPages = this.transformPages();
    await fs.writeFile(outputFile, JSON.stringify(transformedPages, null, 2));
    console.log(
      `Transformed ${transformedPages.length} pages to ${outputFile}`
    );
  }

  private calloutMap: Record<string, CalloutHandler> = {
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
        .map(({ plain_text }: { plain_text: string }) => plain_text)
        .join("");
      const language = block.children[0].code.language;
      return {
        component: "CodeBlock",
        filename: block.callout.rich_text
          .map(({ plain_text }: { plain_text: string }) => plain_text)
          .join(""),
        code: this.highlightCode(code, language),
        language: language,
      };
    },
  };

  private blockMap: Record<string, BlockHandler> = {
    callout: (block) => this.resolveCalloutComponent(block),
    paragraph: (block) =>
      block.paragraph.rich_text.length >= 1
        ? {
            component: "Paragraph",
            text: block.paragraph.rich_text
              .map(({ plain_text }: { plain_text: string }) => plain_text)
              .join(""),
          }
        : null,
    code: (block) => {
      const code = block.code.rich_text
        .map(({ plain_text }: { plain_text: string }) => plain_text)
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
    numbered_list_item: (block) =>
      block.numbered_list_item.rich_text.length
        ? {
            component: "NumberedListItem",
            text: block.numbered_list_item.rich_text
              .map(({ plain_text }: { plain_text: string }) => plain_text)
              .join(""),
          }
        : null,
    image: (block) => {
      return {
        component: "Image",
        text: "",
        url: block.image.file.url,
      };
    },
  };
}
