// tina/config.ts
import { defineConfig } from "tinacms";
var branch = process.env.HEAD || process.env.VERCEL_GIT_COMMIT_REF || "main";
var config_default = defineConfig({
  branch,
  // Get this from tina.io
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  // Get this from tina.io
  token: process.env.TINA_TOKEN,
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "public"
    }
  },
  // See docs on content modeling for more info on how to setup new content models
  // https://tina.io/docs/schema/
  schema: {
    collections: [
      {
        name: "blog",
        label: "Blog Posts",
        path: "content/blog",
        format: "mdx",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true
          },
          {
            type: "string",
            name: "description",
            label: "Description",
            required: true
          },
          {
            type: "datetime",
            name: "date",
            label: "Date",
            required: true
          },
          {
            type: "string",
            name: "author",
            label: "Author",
            required: true
          },
          {
            type: "image",
            name: "image",
            label: "Featured Image"
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true
          },
          {
            type: "rich-text",
            name: "body",
            label: "Article Body",
            isBody: true
          }
        ]
      },
      {
        name: "servers",
        label: "MCP Servers",
        path: "content/servers",
        format: "json",
        fields: [
          {
            type: "string",
            name: "name",
            label: "Server Name",
            isTitle: true,
            required: true
          },
          {
            type: "string",
            name: "description",
            label: "Description",
            required: true
          },
          {
            type: "string",
            name: "author",
            label: "Author",
            required: true
          },
          {
            type: "string",
            name: "category",
            label: "Category",
            required: true,
            options: [
              "ai-tools",
              "browser-automation",
              "cloud",
              "communication",
              "databases",
              "development",
              "file-systems",
              "finance",
              "media",
              "productivity",
              "search",
              "security",
              "aggregators",
              "other"
            ]
          },
          {
            type: "string",
            name: "language",
            label: "Programming Language",
            required: true
          },
          {
            type: "number",
            name: "stars",
            label: "GitHub Stars",
            required: true
          },
          {
            type: "string",
            name: "github_url",
            label: "GitHub URL",
            required: true
          },
          {
            type: "string",
            name: "npm_package",
            label: "NPM Package"
          }
        ]
      }
    ]
  }
});
export {
  config_default as default
};
