const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: "OPENAPI TEMPLATE API",
            contact : {
                name: "Undefined"
            },
            version: "Alpha 1.0.0",
            servers: ["https://localhost:5000"]
        },
        basePath: "/api",
        paths : {},
        securityDefinitions: {
            Bearer: {
                in: "header",
                name: "auth-token",
                description: "This token is needed to use logged in features",
                required: true,
                type: "apiKey",
            }
        },
        tags: [
            {
                name: "User"
            }
        ],
    },
    apis: ["app.js", './routes/*.js']
};
module.exports = swaggerOptions;