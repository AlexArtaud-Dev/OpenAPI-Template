const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "Finanze API",
            contact : {
                name: "alex3227"
            },
            version: "Alpha 1.0.0",
        },
        servers: [
            {
                url: "https://localhost:5000/api",
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                }
            }
        },
        tags: [
            {
                name: "User",
                description: "Routes for user management"
            },
            {
                name: "Authentication",
                description: "Routes for authentication"
                // externalDocs: {
                //     description: "Find out more",
                //     url: "https://swagger.io"
                // }
            }
        ],
    },
    apis: ["app.js", './routes/*.js']
};
module.exports = swaggerOptions;
