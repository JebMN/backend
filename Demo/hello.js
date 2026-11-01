console.log(
	"Lets implemet a minimal backend with node and call it from a browser",
);

const http = require("node:http");

//create a server by using http module
const server = http.createServer((req, res) => {
	console.log(req.method, req.url);

	//lets the serve the movies path
	if (req.method === "GET" && req.url === "/movies") {
		//return movie local data
		const movies = [
			{ id: 1, name: "Train Spotting", year: 2010 },
			{ id: 2, name: "Train Spotting 2", year: 2011 },
		];
		res.writeHead(200, {
			"Content-Type": "application/json; charset=utf-8",
		});
		return res.end(JSON.stringify(movies));
	}
	//lets respond to the client by sending ok (200) and some text
	res.writeHead(200, {
		"Content-Type": "text/plain; charset=utf-8",
	});
	res.end("Hello from the backend");
});

//Start the server
server.listen(3000, () => {
	console.log("sever listening at http://localhost:3000");
});
