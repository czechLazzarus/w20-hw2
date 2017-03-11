var http = require("http");
var qs = require("querystring");

var storage = {
    orderId: 0,
    orders: [],
    finishedOrders: [],
    items: [{}],
    getOrderItems: function (orderId) {
        var output = [];
        for (var i = 0; i < this.items.length; i++)
            if (this.items[i].orderId == orderId)
                output.push(this.items[i].item);
        return output;
    },
    orderExist: function (orderId) {
        for (var i = 0; i < this.orders.length; i++) {
            if (this.orders[i] == orderId) {
                return true;
            }
        }
        return false;
    },
    addOrder: function () {
        this.orderId++;
        this.orders.push(this.orderId);
        return this.orderId;
    },
    addItem: function (orderId, item) {
        this.items.push({orderId: orderId, item: item});
    },
    finishOrder: function (orderId) {
        this.finishedOrders.push(orderId);
    },
    isOrderFinished: function (orderId) {
        for (var i = 0; i < this.finishedOrders.length; i++) {
            if (this.finishedOrders[i] == orderId) {
                return true;
            }
        }
        return false;
    }
};

http.createServer(function (req, res) {
    var body = "";

    req.on('data', function (chunk) {
        body += chunk;
    });

    if (req.method == "POST") {
        if ((id = req.url.match("^/order/([1-9]+)$"))) {
            req.on('end', function () {
                var orderId = id[1];
                res.writeHead(200, {'Content-Type': 'application/json'});
                if (storage.orderExist(orderId)) {
                    var post = qs.parse(body);
                    var value = Object.keys(post)[0];
                    console.log(value);
                    storage.addItem(orderId, value);
                    res.end("Item added - " + value+"\n");
                } else {
                    res.end('Order doesnt exist');
                }
            });
        } else if ((id = req.url.match("^/order-finish/([1-9]+)$"))) {
            var orderId = id[1];
            res.writeHead(200, {'Content-Type': 'application/json'});
            if (storage.orderExist(orderId)) {
                storage.finishOrder(orderId);
                res.end("Order "+ orderId+ " finished\n");
            } else {
                res.end("Order is finished or doesnt exist\n");
            }
        } else if ((id = req.url.match("^/order"))) {
            res.writeHead(201, {'Content-Type': 'application/json'});
            req.on('end', function () {
                res.end("Order "+JSON.stringify(storage.addOrder())+ " created\n");
            });
        } else {
            res.writeHead(300, {'Content-Type': 'text/plain'});
            res.end('Undefined page');
        }
    } else if (req.method == "GET") {
        if ((id = req.url.match("^/order/([1-9]+)$"))) {
            var orderId = id[1];
            res.writeHead(200, {'Content-Type': 'application/json'});

            if(storage.orderExist(orderId)) {
                res.end(JSON.stringify(storage.getOrderItems(orderId))+'\n');
            } else {
                res.end('Order doesnt exist\n');
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