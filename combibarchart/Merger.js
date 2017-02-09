var Merger = function(data) {
    this.data = data.slice();  // taking a copy
    this.merges = {};
    this.current_merge = [];
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
    if(this.current_merge.indexOf(category) > -1) {
        throw new Error('Cannot repeat categories!');  
    };
    this.current_merge.push(category);
};

Merger.prototype.remove_category = function(category) {
    var index = this.current_merge.indexOf(category)
    if(index === -1) {
        throw new Error('Cannot remove category, it is not in the queue!');  
    };
    this.current_merge.pop(index + 1);
};

Merger.prototype.merge = function(cat_name) {
    if(this.current_merge.length === 0) {
        throw new Error('Nothing to merge!');
    };

    // defining new category and its position
    var self = this;
    var idx = this.allowed_categories.indexOf(this.current_merge[0]);
    var value = this.data.reduce(function reduce_fun(elem1, elem2) {
        if(self.current_merge.indexOf(elem2.category) > -1) {
            return elem1 + elem2.value;
        } else {
            return elem1;
        }
    }, 0);
    this.data.splice(idx, 0, {category: cat_name, value: value});

    // removing data
    var removed_data = [];
    this.data = this.data.filter(function(elem) {
        if(self.current_merge.indexOf(elem.category) > -1) {
            removed_data.push(elem);
            return false;
        } else {
            return true;
        };
    });

    // storing info on merger
    var composite_cats = Object.keys(this.merges);
    this.merges[cat_name] = [];
    for (var i = removed_data.length - 1; i >= 0; i--) {
        var target = removed_data[i]
        if(composite_cats.indexOf(target.category) > -1) {
            Array.prototype.push.apply(this.merges[cat_name],
                                       this.merges[target.category]);
            delete this.merges[target.category];
        } else {
            this.merges[cat_name].push(target);
        };
    };
        
    this.current_merge = [];
    return this.data;
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

