import express from "express";
import routes from "./src/web/routes.mjs";

const app = express();
app.use(express.static("public"));
app.use(routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`image-tools rodando em http://localhost:${PORT}`));
