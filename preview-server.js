const http = require("http");
const fs = require("fs");
const path = require("path");

const port = 3007;
const htmlPath = path.join(__dirname, "artifacts", "nova-identidade-preview.html");

const server = http.createServer((req, res) => {
  const url = req.url || "/";

  if (url === "/" || url === "/nova-identidade") {
    fs.readFile(htmlPath, "utf8", (error, html) => {
      if (error) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Erro ao carregar preview.");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      res.end(html);
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Preview server running at http://127.0.0.1:${port}/nova-identidade`);
});
