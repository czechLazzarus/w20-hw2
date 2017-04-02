var http = require("http");
var qs = require("querystring");
var crypto = require("crypto");

var storage = {
    lastModified: "",
    orderId: 0,
    customerId: 0,
    customers: [{}],
    orders: [{}],
    getCustomerOrders: function (customer) {
        var output = [];
        for (var i = 0; i < this.orders.length; i++)
            if (this.orders[i].customer == customer)
                output.push(this.orders[i]);
        return output;
    },
    createCustomer: function (customer) {
        this.customerId++;
        this.customers.push({customerId: this.customerId, customer: customer});
        return this.customerId;
    },
    customerExistById: function (customerId) {
        for (var i = 0; i < this.customers.length; i++) {
            if (this.orders[i].customerId == customerId) {
                return true;
            }
        }
        return false;
    },
    customerExistByName: function (customer) {
        for (var i = 0; i < this.customers.length; i++) {
            if (this.customers[i].customer == customer) {
                return true;
            }
        }
        return false;
    },
    getCustomer: function (customerId) {
        var output = [];
        for (var i = 0; i < this.customers.length; i++)
            if (this.customers[i].customerId == customerId)
                return this.customers[i];
        return false;
    },
    customerByName: function (customer) {
        for (var i = 0; i < this.customers.length; i++) {
            if (this.customers[i].customer == customer) {
                return this.customers[i].customerId;
            }
        }
        return 0;
    },
    addOrder: function (customer) {
        this.orderId++;
        this.orders.push({orderId: this.orderId, customer: customer});
        return this.orderId;
    },
    getCustomerData: function (customerId) {
        var customersData = this.getCustomer(customerId);
        var output = {};
        if (customersData && customerId) {
            output = {
                "id": customerId,
                "name": customersData.customer,
                "orders": this.getCustomerOrders(customersData.customer)
            }
            return output;
        } else {
            return false;
        }

    },
    getCustomerWeakData: function (customerId) {
        var customersData = this.getCustomer(customerId);
        var output = {};
        if (customersData && customerId) {
            output = {
                "id": customerId,
                "name": customersData.customer,
            };
            return output;
        } else {
            return false;
        }

    },
    getCustomersData: function() {
        var output = [];
        for (var i = 0; i < this.customers.length; i++) {
            var data = this.getCustomerData(this.customers[i].customerId);
            if (data) {
                output.push(data);
            }
        }
        return output;
    },
    getWeakCustomerData: function() {
        var output = [];
        for (var i = 0; i < this.customers.length; i++) {
            var data = this.getCustomerWeakData(this.customers[i].customerId);
            if (data) {
                output.push(data);
            }
        }
        return output;
    }
};

function computeETag(orders) {
    var content = "";
    for (var i = 0; i < orders.length; i++)
        content += orders[i].id + orders[i].customer + orders[i].descr;
    return crypto.createHash('md5').update(content).digest("hex");
}

http.createServer(function (req, res) {
    var body = "";
    var user = "";
    if (req.headers && req.headers["login"]) {
        user = req.headers["login"];

        if (!storage.customerExistByName(user)) {
            storage.createCustomer(user);
            storage.lastlastModified = new Date().toUTCString();
        }
        customerId =storage.customerByName(user);
    } else {
        res.writeHead(300, {'Content-Type': 'text/plain'});
        res.end('Use login');
    }

    if (storage.customerExistById())
    req.on('data', function (chunk) {
        body += chunk;
    });

    if (req.method == "POST") {
        if ((id = req.url.match("^/order"))) {
            res.writeHead(201, {'Content-Type': 'application/json'})
             req.on('end', function () {
                storage.addOrder(user);
                storage.lastlastModified = new Date().toUTCString();
                res.end("Customer:"+user+ " added order");
            });
        }
        else {
            res.writeHead(300, {'Content-Type': 'text/plain'});
            res.end('Undefined page');
        }
    } else if (req.method == "GET") {
        if ((id = req.url.match("^/customers"))) {
            var weak = false;
            if (req.headers && req.headers["weak"]) {
                weak = true;
            }
            if (req.headers && req.headers["if-none-match"]) {
                var condition = req.headers["if-none-match"]
            }
            var output = JSON.stringify(storage.getCustomersData());
            if (weak) {
                var Etag = "W/"+computeETag(storage.getWeakCustomerData);
            } else {
                var Etag = computeETag(output);
            }

            if(Etag == condition) {
                res.writeHead(304, {'Content-Type': 'application/json',"Cache-Control": "private, no-store, max-age=200", "Last-Modified": storage.lastlastModified, "ETag": Etag});
            } else {
                storage.lastlastModified = new Date().toUTCString();
                res.writeHead(200, {'Content-Type': 'application/json',"Cache-Control": "private, no-store, max-age=200", "Last-Modified": storage.lastlastModified, "ETag": Etag});
            }

            req.on('end', function () {
                res.end(output);
            });
        } else {
            res.writeHead(300, {'Content-Type': 'text/plain'});
            res.end('Undefined page');
        }
    } else {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Undefined page');
    }


}).listen(8080);