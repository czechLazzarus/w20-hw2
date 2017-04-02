var http = require("http");
var qs = require("querystring");

var storage = {
    orderId: 0,
    deletableOrderId: 0,
    orders: [],
    finishedOrders: [],
    deletableOrders: [{}],
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
    prepareForDeleteByOrderId: function (orderId, user) {
        for (var i = 0; i < this.orders.length; i++) {
            if (this.orders[i] == orderId) {
                this.deletableOrders.push({orderId: orderId, user: user})
                return true;
            }
        }
        return false;
    },
    deletePreparedByOrderId: function (orderId, user) {
        for (var i = 0; i < this.deletableOrders.length; i++) {
            if (this.deletableOrders[i].orderId == orderId && this.deletableOrders[i].user == user) {
                this.deletableOrders.pop(i);
                this.orders.pop(orderId);
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
    var user = "";
    if (req.headers && req.headers["login"]) {
        user = req.headers["login"];
        console.log(user);
    }

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
        } else if ((id = req.url.match("^/order"))) {
            res.writeHead(201, {'Content-Type': 'application/json'});
            req.on('end', function () {
                res.end("Order "+JSON.stringify(storage.addOrder())+ " created\n");
            });

        } else if ((id = req.url.match("^/confirm-delete/([1-9]+)$"))) {
            var orderId = id[1];
            req.on('end', function () {
                if (storage.deletePreparedByOrderId(orderId, user)) {
                    res.writeHead(201, {'Content-Type': 'application/json'});
                    res.end("Order "+orderId+ " deleted\n");
                } else {
                    res.writeHead(300, {'Content-Type': 'application/json'});
                    res.end("Wrong login or orderId or you have not premission");
                }

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
    } else if (req.method == "DELETE") {
        if ((id = req.url.match("^/order/([1-9]+)$"))) {
            var orderId = id[1];
            if(storage.orderExist(orderId)) {
                result = storage.prepareForDeleteByOrderId(orderId, user)
                if (result && user) {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end('Order prepared for DELETE confirm with your user name and POST /confirm-delete/'+orderId);
                }
            }
            res.writeHead(300, {'Content-Type': 'application/json'});
            res.end('Order doesnt exist or you have not premission\n');
        } else {
            res.writeHead(300, {'Content-Type': 'text/plain'});
            res.end('Undefined page');
        }
    } else {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Undefined page');
    }


}).listen(8080);