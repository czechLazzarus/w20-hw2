var net = require('net');
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

var server = net.createServer(function(c) {
    var order = storage.addOrder();
    c.setEncoding('utf8');
    c.write('Order '+order +' opened \n');
    c.write('You can add new items to your order \n');
    c.write('Write "end" to finish your order \n');
    c.on('end', function() {
        console.log('connection/socket closed');

    });
    c.on('data', function(data) {
        var item = data.trim();
        if(item == "end") {
            if ((storage.orderExist(order)) || !(storage.isOrderFinished(order))) {
                storage.finishOrder(order);
                c.write('Order '+order +' closed\n');
                c.write('Items '+storage.getOrderItems(order) +' closed\n');
                c.end();
            } else {
                c.write('Order doesnt exist or is already finished\n');
                c.end();
            }
        }
        if (storage.orderExist(order)) {
            storage.addItem(order,item);
            c.write('Item added - '+item+'\n');
        } else {
            c.write('Order doesnt exist\n');
        }
    });

    c.on('error', function(err) {
        console.log(err.message);
    });
});

server.listen(8124, function() {
    console.log('server started');
});
