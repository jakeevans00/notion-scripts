# notion-to-json

This package is designed to help quickly export content from a Notion database to `json` format, for use in external projects.

## Getting Started

#### Notion

First, open desktop app and perform the following:

1. Open desired database in Notion
2. Navigate to Menu -> Connect to -> Manage Connections
3. In web page, select "Develop or Manage integrations." Name and save.
4. Return to database and create connection to your new integration (Menu -> Connect to -> Manage Connections)

#### Dev Environment

5. Clone the repo: `git clone https://github.com/jakeevans00/notion-scripts.git`

6. `cd notion-scripts && npm install`
7. Finally, create a file called `.env` and paste in your API_KEY in the same format shown in the `.example.env` file (`NOTION_API_KEY=secret_abc`)

Run `npm start <Database-Name>`
For example, I would run `npm start demo` if I wanted this database (with all child subpages) exported to json
![demoe](https://prod-files-secure.s3.us-west-2.amazonaws.com/db3adc64-2954-4f92-817f-4c257437946a/36faf469-4e4d-41fa-9f05-cbeb093da661/Screenshot_2024-09-20_at_5.08.01_PM.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45HZZMZUHI%2F20240921%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20240921T091419Z&X-Amz-Expires=3600&X-Amz-Signature=97636cf9162f05ed7b3b9da3c711c75e1e5ab1c4573b1db93e66a2bbd7cfd246&X-Amz-SignedHeaders=host&x-id=GetObject)
