Event_publisher = function() {
    this.handlers = [];
};

Event_publisher.prototype.subscribe = function(callback, object) {
    // the object given should be the object from which the callback is from
    this.handlers.push({origin: object, callback: callback});
};

Event_publisher.prototype.notify = function(event) {
    for (var i = this.handlers.length - 1; i >= 0; i--) {
        this.handlers[i].callback(event);
    };
};

Event_publisher.prototype.unsubscribe = function(object) {
    this.handlers = this.handlers.filter(function(handler) {
        return handler.origin !== object;
    })
};

Event_publisher.prototype.purge_all = function(event) {
    this.handlers = [];
};
