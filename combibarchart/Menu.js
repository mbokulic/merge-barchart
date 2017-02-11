var Menu = function(html_wrapper) {
    Event_publisher.call(this);
    this.html_wrapper = html_wrapper;

    // state variables
    this.ascending = true;

    this.html_wrapper.append('i')
        .attr('id', 'sort-button')
        .attr('class', 'fa fa-sort-amount-asc')

    this.html_wrapper.append('button')
        .attr('id', 'merge-button')
        .attr('class', 'btn')
        .on('click', this.merge_button_handler.bind(this));

    this.name_input = this.html_wrapper.append('input')
        .attr('type', 'text')
        .attr('id', 'name_input');

    this.warning = this.html_wrapper.append('p')
        .attr('id', 'warning-message')
        .text('/');

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
            .duration(1200)
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
        d3.select('#panel')
            .selectAll('.unmerge-category')
            .on('click', null)
            .remove();

        d3.select('#panel')
          .selectAll('.unmerge-category')
            .data(event.data.merged_names)
            .enter()
            .append('p')
            .classed('unmerge-category', true)
            .text(function(d) {return d})
            .on('click', this.unmerge_button_handler.bind(this));
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
