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
        .on('click', this.merge_handler.bind(this));

    this.name_input = this.html_wrapper.append('input')
        .attr('type', 'text')
        .attr('id', 'name_input');

    this.warning = this.html_wrapper.append('p')
        .attr('id', 'warning-message')
        .text('/');

};

Menu.prototype.merge_handler = function() {
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

    var new_data = merger.merge(cat_name);
    ad_hoc_idx ++;
    chart.draw(new_data)

    var last_merge = merger.get_last_merge();
    if(last_merge.components.length > 0) {
        for(idx in last_merge.components) {
            var name = last_merge.components[idx];
            d3.select('#panel')
              .select('.unmerge_category[category_name=' + name + ']')
              .on('click', null)
              .remove();
        };
    };
};

//         d3.select('#panel')
//           .append('p')
//             .text(cat_name)
//             .classed('unmerge_category', true)
//             .attr('category_name', cat_name)
//             .on('click', function click_handler() {
//                 var target = d3.select(event.target);
//                 var cat_name = target.attr('category_name');
//                 var new_data = merger.unmerge(cat_name);
//                 chart.draw(new_data);
//                 target.on('click', null).remove()
//             });
//     });

//     d3.select('#sort-button').on('click', function() {
//         ascending = !ascending;
//         sort_chart();
//     });

// }

var merge = function(dataset) {
    chart.draw(dataset);
}
