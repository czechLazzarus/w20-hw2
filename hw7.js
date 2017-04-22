var http = require("http");
var qs = require("querystring");
var crypto = require("crypto");
var url = require('url');

var storage = {
    orders : ["deal1","deal2","deal3","deal4","deal5","deal6","deal7"],
    getOrders: function (page, per_page) {
        var output = [];
        var from = (page - 1) * per_page;
        var to = page * per_page;

        for (var i = from; i < to; i++) {
            if (this.orders[i]) {
                output.push(this.orders[i]);
            }
        }

        return output;
    },
    getPageCount: function (perPage) {
        return Math.ceil(this.orders.length / perPage);
    }
};

http.createServer(function (req, res) {
    var page = 1;
    var PER_PAGE = 3;
    var url_parts = url.parse(req.url,true);
    if (url_parts.query.page) {
        page = parseInt(url_parts.query.page);
    }
    if (url_parts.query.perpage) {
        PER_PAGE = url_parts.query.perpage;
    }
    if (req.method == "GET") {
        if ((id = req.url.match("^/orders"))) {
                var down = undefined;
                var up = undefined;
                var previous = "";
                var next = "";
                var first = "";
                var last = "";
                var linkValues = []
                if (page > 1) {
                    down = page - 1;
                    first = '<http://localhost:8080/orders?page=1>; rel="first"';
                    previous = '<http://localhost:8080/orders?page='+down+'>; rel="prev"';
                    linkValues.push(first);
                    linkValues.push(previous);
                }
                if (page < storage.getPageCount(PER_PAGE)) {
                    up = page + 1;
                    next = '<http://localhost:8080/orders?page='+up+'>; rel="next"';
                    last = '<http://localhost:8080/orders?page='+storage.getPageCount(PER_PAGE)+'>; rel="last"';
                    linkValues.push(next);
                    linkValues.push(last);
                }
                if (!page) {
                    page = 1;
                }

                if (storage.getOrders(page, PER_PAGE) && linkValues.length > 1) {
                    res.writeHead(200, {'Content-Type': 'text/plain','Link': linkValues.join(",")});
                    res.end(JSON.stringify(storage.getOrders(page, PER_PAGE)));
                } else {
                    res.end("Undefined page");
                }

        } else {
            res.writeHead(300, {'Content-Type': 'text/plain'});
            res.end('Undefined page');
        }
    } else {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Undefined page');
    }


}).listen(8080);