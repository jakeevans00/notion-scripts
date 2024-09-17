const fs = require("fs");
const path = require("path");
const hljs = require("highlight.js/lib/common");

const outputFile = path.join(__dirname, "notion-pages.json");
const transformedOutput = path.join(__dirname, "content.json");

if (!fs.existsSync(outputFile)) {
  console.error(`File not found: ${outputFile}`);
}

const pages = JSON.parse(fs.readFileSync(outputFile));

const blockMap = {
  //   callout: (block) => {
  //     const result = resolveCalloutComponent(block);
  //     if (!result) return null;
  //     return result;
  //   },
  paragraph: (block) => {
    if (block.paragraph.rich_text.length === 0) return null;
    return {
      component: "Paragraph",
      text: block.paragraph.rich_text
        .map(({ plain_text }) => plain_text)
        .join(""),
    };
  },
};

function transformBlocks(blocks) {
  return blocks
    .map((block) => {
      if (blockMap[block.type]) {
        return blockMap[block.type](block);
      }
      console.log("NOT SUPPORTED:", block.type);
    })
    .filter(Boolean);
}

let output = pages.map((page) => {
  const { properties, children, id } = page;
  return {
    id,
    title: properties.Name.title[0].text.content,
    urlPath: properties.Slug.rich_text[0].plain_text,
    blocks: transformBlocks(children),
  };
});

fs.writeFileSync(transformedOutput, JSON.stringify(output, null, 2));
console.log(`Transformed ${output.length} pages to ${transformedOutput}`);
