var Merger = function() {
    Event_publisher.call(this);
    this.merges = {};
    this.queue = [];

    this.chart_handler = this.chart_handler.bind(this);
    this.menu_handler = this.menu_handler.bind(this);

};

Merger.prototype = Object.create(Event_publisher.prototype);

Merger.prototype.init = function(data) {
    this.data = data.slice();  // taking a copy
};

Object.defineProperty(Merger.prototype, "allowed_categories", {
    get: function() {
        var categories = this.data.map(function map_fun(elem) {
            return elem.category;
        });
        return categories;
    }
});

Merger.prototype.get_data = function() {
    return this.data;
};

Merger.prototype.add_category = function(category) {
    if(this.allowed_categories.indexOf(category) == -1) {
        throw new Error('Category not in the dataset!');
    };
    if(this.queue.indexOf(category) > -1) {
        throw new Error('Cannot repeat categories!');  
    };
    this.queue.push(category);
};

Merger.prototype.remove_category = function(category) {
    var index = this.queue.indexOf(category)
    if(index === -1) {
        throw new Error('Cannot remove category, it is not in the queue!');  
    };
    this.queue.splice(index, 1);
};

Merger.prototype.merge = function(cat_name) {
    if(this.queue.length === 0) {
        throw new Error('Nothing to merge!');
    };

    // defining new category and its position
    var self = this;
    for (var i = 0; i < this.allowed_categories.length; i++) {
        if(this.queue.indexOf(this.allowed_categories[i]) > -1) {
            var highest_category = this.allowed_categories[i];
            var highest_cat_index = i;
            break;
        };
    };
    var value = this.data.reduce(function reduce_fun(elem1, elem2) {
        if(self.queue.indexOf(elem2.category) > -1) {
            return elem1 + elem2.value;
        } else {
            return elem1;
        };
    }, 0);
    this.data.splice(highest_cat_index, 0, {category: cat_name, value: value});

    // removing data
    var removed_data = [];
    this.data = this.data.filter(function(elem) {
        if(self.queue.indexOf(elem.category) > -1) {
            removed_data.push(elem);
            return false;
        } else {
            return true;
        };
    });

    // storing info on merger
    var composite_cats = Object.keys(this.merges);
    this.merges[cat_name] = [];
    for (var i = 0; i < removed_data.length; i++) {
        var target = removed_data[i]
        if(composite_cats.indexOf(target.category) > -1) {
            Array.prototype.push.apply(this.merges[cat_name],
                                       this.merges[target.category]);
            delete this.merges[target.category];
        } else {
            this.merges[cat_name].push(target);
        };
    };
        
    this.queue = [];
    return highest_category;
}

Merger.prototype.unmerge = function(cat_name) {
    var cat_position = this.allowed_categories.indexOf(cat_name)
    if(cat_position === -1) {
        throw new Error('there is no such category');
    };

    Array.prototype.splice.apply(
        this.data, [cat_position, 0].concat(this.merges[cat_name]));
    this.data = this.data.filter(function filter_func(elem) {
        if(elem.category === cat_name) {
            return false;
        } else {
            return true;
        };
    });

    delete this.merges[cat_name];
    return this.data;
};

Merger.prototype.chart_handler = function(event) {
    if(event.action == 'category_click') {
        if(event.data.add) {
            this.add_category(event.data.name);
        } else {
            this.remove_category(event.data.name);
        };
    };
};

Merger.prototype.menu_handler = function(event) {
    if(event.action == 'merge') {
        // category name exists
        // event should contain current category names
        var taken_names = Object.keys(this.merges);
        if(taken_names.indexOf(event.data.name) > -1) {
            this.notify({
                action: 'merge_error',
                data: {
                    error_type: 'category_exists',
                    error_message: 'category name taken!'
                }
            });
            return;
        };

        if(this.queue.length == 0) {
            this.notify({
                action: 'merge_error',
                data: {
                    error_type: 'empty_queue',
                    error_message: 'merge queue is empty!'
                }
            });
            return;
        };

        var active_cats = this.queue;
        var highest_category = this.merge(event.data.name);
        this.notify({
            action: 'merge',
            data: {
                merged_names: Object.keys(this.merges),
                dataset: this.data,
                merge_into: highest_category,
                active_cats: active_cats 
            }
        });
    };

    if(event.action == 'unmerge') {
        var data = this.unmerge(event.data.name);
        this.notify({
            action: 'unmerge',
            data: {
                dataset: data,
                name: event.data.name
            }
        });
    };
};

