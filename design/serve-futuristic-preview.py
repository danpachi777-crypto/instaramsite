"""Local-only preview proxy. Run while the Next dev server uses port 3000."""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


UPSTREAM = "http://127.0.0.1:3000"
DROP_HEADERS = {
    "connection",
    "content-security-policy",
    "content-length",
    "transfer-encoding",
    "x-frame-options",
}


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.forward()

    def do_HEAD(self):
        self.forward()

    def do_POST(self):
        self.forward()

    def forward(self):
        size = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(size) if size else None
        headers = {
            key: value
            for key, value in self.headers.items()
            if key.lower() not in {"host", "connection", "accept-encoding", "content-length"}
        }
        headers["Accept-Encoding"] = "identity"
        request = Request(
            UPSTREAM + self.path,
            data=body,
            headers=headers,
            method=self.command,
        )
        try:
            response = urlopen(request, timeout=30)
        except HTTPError as error:
            response = error
        except URLError:
            self.send_error(502, "Next dev server is unavailable on port 3000")
            return

        with response:
            data = response.read() if self.command != "HEAD" else b""
            self.send_response(response.status)
            for key, value in response.headers.items():
                if key.lower() not in DROP_HEADERS:
                    self.send_header(key, value)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(data)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 4174), Handler)
    print("Preview: http://127.0.0.1:4174/design/futuristic-current-ui-10.html", flush=True)
    server.serve_forever()
