var Menu = function(html_wrapper) {
    Event_publisher.call(this);
    this.html_wrapper = html_wrapper;

    // state variables
    this.ascending = true;

    this.html_wrapper.append('a')
        .attr('id', 'sort-button')
        .attr('class', 'btn')
        .text('sort')
        .on('click', this.sort_button_handler.bind(this));

    this.html_wrapper.append('a')
        .attr('id', 'merge-button')
        .attr('class', 'btn')
        .text('merge')
        .on('click', this.merge_button_handler.bind(this));

    this.name_input = this.html_wrapper.append('input')
        .attr('type', 'text')
        .attr('id', 'name_input')
        .attr('placeholder', 'name');

    this.warning = this.html_wrapper.append('div')
        .attr('id', 'warning-message-wrapper')
        .append('p')
        .attr('id', 'warning-message');

    this.category_list = this.html_wrapper.append('div')
        .attr('id', 'category-list')

    this.merger_handler = this.merger_handler.bind(this);

};

Menu.prototype = Object.create(Event_publisher.prototype);

Menu.prototype.merge_button_handler = function() {
    var name = this.name_input.property('value');
    if(name == '') {
        this.warning
            .text('type category name!')
            .style('opacity', 1)
            .transition()
            .style('opacity', 0)
            .duration(1000)
            .ease(d3.easeCubicIn)
        return;
    };

    this.notify({
        action: 'merge',
        data: {name: name}
    });
    
};

Menu.prototype.merger_handler = function(event) {
    if(event.action == 'merge_error') {
        this.warning
            .text(event.data.error_message)
            .style('opacity', 1)
            .transition()
            .style('opacity', 0)
            .duration(1200)
            .ease(d3.easeCubicIn)
        return;
    };

    if(event.action == 'merge') {
        this.name_input.property('value', '');
        d3.selectAll('.unmerge-category')
            .on('click', null)
            .remove();

        var temp = d3.select('#category-list')
          .selectAll('.unmerge-category')
            .data(event.data.merged_names)
            .enter()
          .append('a')
            .classed('unmerge-category', true)
            .on('click', this.unmerge_button_handler.bind(this));
          
        temp.append('span').classed('fa fa-times', true);
        temp.append('p').text(function(d) {return d})
    };

};

Menu.prototype.unmerge_button_handler = function() {
    var click_target = d3.select(event.currentTarget);
    var cat_name = click_target.text();
    this.notify({
        action: 'unmerge',
        data: {name: cat_name}
    });
    click_target.on('click', null).remove();
};

Menu.prototype.sort_button_handler = function() {
    this.notify({
        action: 'sort',
        data: {ascending: this.ascending}
    });
    this.ascending = !this.ascending;
};
