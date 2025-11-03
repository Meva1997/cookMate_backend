import swaggerJSDoc from "swagger-jsdoc";
import { SwaggerUiOptions } from "swagger-ui-express";

const options: swaggerJSDoc.Options = {
  swaggerDefinition: {
    openapi: "3.0.2",
    info: {
      title: "Cookmate API",
      version: "1.0.0",
      description: "API documentation for the Cookmate application",
    },
    tags: [
      {
        name: "Authentication",
        description: "Operations related to user authentication",
      },
      {
        name: "Users",
        description: "Operations related to users",
      },
      {
        name: "Recipes",
        description: "Operations related to recipes CRUD",
      },
      {
        name: "Comments",
        description: "Operations related to comments",
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/models/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

const swaggerUiOptions: SwaggerUiOptions = {
  customCss: `
    .topbar-wrapper .link {
      content: url('https://res.cloudinary.com/dukbscvow/image/upload/v1762180195/logo_mnxcoy.png');
      height: 200px;
      width: auto;
    },
  `,
  customSiteTitle: "Cookmate API Docs",
  customfavIcon:
    "https://res.cloudinary.com/dukbscvow/image/upload/v1762180195/logo_mnxcoy.png",
};

export default swaggerSpec;
export { swaggerUiOptions };
