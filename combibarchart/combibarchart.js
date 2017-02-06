// transition of labels is reverse when descending


// hardcoding chart width
var total_width = 700;
var margin = {top: 20, right: 20, bottom: 20, left: 20};
var labels_width = 150;
margin.left += labels_width; // adding label width to margin
var draw_width = total_width - margin.left - margin.right 
var row_height = 40; 

var wrapper = d3.select('#chart-wrapper')
    .style('width', total_width+'px');

var svg = wrapper.append('svg')
    .attr('width', total_width)
    .attr('id', 'chart');

var draw_area = svg.append('g')
    .attr('class', 'draw-area')
    .attr('width', draw_width)
    .attr('transform', 'translate(' + margin.left + ',' +  margin.top + ')')

var tooltip = wrapper.append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style('width', '100px');

// keeping these variables in the global namespace
var chart_height;
var scale_x;
var scale_y;
var axis_x;
var axis_y;
var dataset;
var original_dataset;
var ascending = true;

var draw = function(error, data) {
    dataset = data;
    original_dataset = data;

    // setting height based on the number of data points
    set_chart_height(dataset);

    // initial ordering is the same as in the loaded dataset
    scale_y = d3.scaleBand()
        .domain(dataset.map(function(d) { return d.city }))
        .rangeRound([0, chart_height])
        .padding(0.3);

    scale_x = d3.scaleLinear()
        .range ([0, draw_width])
        .domain([0, d3.max(dataset, function(d) { return(d.rainfall); })]);

    // now that scale_y is defined, setting tooltip height
    tooltip.style('height', scale_y.bandwidth() + 'px');

    // adding bars
    draw_area.selectAll('g')
        .data(data, function(d) {return d.city})
        .enter()
      .append('g')
        .attr('transform', function(d, i) {
            return 'translate(0, ' + (scale_y(d.city)) + ')';
        })
        .attr('category_name', function(d) { // for pairing with labels
            var category = d.city
            category = category.replace(/ /g, '_')
            return category
        })
        .classed('bar', true)
        .on('mouseover', function(d, i) {
            tooltip.transition()
              .duration(200)
              .style('opacity', .7);
            tooltip
              .style('top', (scale_y(d.city) + margin.top) + 'px')
              .style('left', (scale_x(d.rainfall) + margin.left) + 'px')
              .text(d.rainfall + 'mm');
        })
        .on('mouseout', function(d) {
            tooltip.transition()
              .duration(300)
              .style('opacity', 0);
        })
      .append('rect')
        .attr('y', scale_y.padding() * 0.5)
        .attr('width', function(d) {
            return scale_x(d.rainfall);
        })
        .attr('height', scale_y.bandwidth())
        .attr('fill', 'darkred')
        .attr('z-index', 2);

    axis_x = d3.axisBottom()
        .scale(scale_x)
        .tickSizeOuter(0)
        .tickSizeInner(8);
    draw_area.append('g')
        .attr('id', 'x-axis')
        .attr('transform', 'translate(0, ' + (chart_height) + ')')
        .call(axis_x);

    // var gridlines_x = d3.axisBottom()
    //     .scale(scale_x)
    //     .tickSize(-chart_height)
    //     .tickFormat('');
    // draw_area.insert('g', ':first-child') // puts them behind rects
    //     .attr('class', 'gridlines x')
    //     .attr('transform', 'translate(0,' + chart_height + ')')
    //     .call(gridlines_x);

    axis_y = d3.axisLeft()
        .scale(scale_y)
        .tickSize(4);
    draw_area.append('g')
        .attr('id', 'y-axis')
        .call(axis_y);

    // adding rects that will serve as click targets for labels
    d3.select('#y-axis')
        .selectAll('g')
      .classed('label', true)
        .append('rect')
      .data(data)
      .attr('class', 'label-click-target')
      .attr('category_name', function(d) {
            var category = d.city
            category = category.replace(/ /g, '_')
            return category
      })
      .attr('width', labels_width)
      .attr('height', scale_y.bandwidth())
      .attr('fill', 'yellow')
      .attr('opacity', 0)
      .attr('x', -labels_width)
      .attr('y', -scale_y.bandwidth() / 2)

    register_handlers();

}

var set_chart_height = function(data) {
    chart_height = data.length * row_height;
    svg.attr('height', chart_height + margin.bottom + margin.top);
    draw_area.attr('height', chart_height);
};

var register_handlers = function() {
    var bars = d3.selectAll('.bar');
    var labels = d3.selectAll('.label');

    bars.on('click', function() {
        var target = d3.select(this);
        var category_name = target.attr('category_name');
        var highlighted = target.classed('highlight');
        target.classed('highlight', !highlighted)
        var parent = d3
            .selectAll('.label rect[category_name="' +
                                  category_name + '"')
            .node()
            .parentNode;
        d3.select(parent).classed('highlight', !highlighted);
        
    });

    d3.selectAll('.label-click-target').on('click', function() {
        var parent = d3.select(this.parentNode);
        // category name is in the target
        var category_name = this.getAttribute('category_name');
        var highlighted = parent.classed('highlight')
        parent.classed('highlight', !highlighted);
        d3.selectAll('.bar[category_name="' + category_name + '"')
          .classed('highlight', !highlighted);
    });

    d3.select('#sort-button').on('click', function() {
        ascending = !ascending;
        sort_chart();
    });

    d3.select('#combine-button').on('click', function() {
        var target = d3.selectAll('.bar.highlight');
        var category_names = []
        target.each(function() {
            category_names.push(d3.select(this).attr('category_name'))
        });
        combine_categories(category_names);

    })
}

var combine_categories = function(categories) {
    for (var i = categories.length - 1; i >= 0; i--) {
        categories[i] = categories[i].replace(/_/g, ' ')
    }
    dataset = dataset.filter(function(d) {
        if(categories.indexOf(d.city) > -1) {
            return false
        } else {
            return true
        }
    })

    set_chart_height(dataset);

    scale_y
        .domain(dataset.map(function(d) {return d.city}))
        .rangeRound([0, chart_height]) 
        .padding(0.3);

    d3.selectAll('.bar')
        .remove()
    d3.select('#x-axis')
        .remove()
    d3.select('#y-axis')
        .remove()

    draw_area.selectAll('g')
        .data(dataset)
        .enter()
        .append('g')
        .classed('bar')
        .attr('transform', function(d) {
            return 'translate(0, ' + scale_y(d.city) + ')'
        })

    debugger;

    axis_y = d3.axisLeft()
        .scale(scale_y)
    d3.select('#y-axis')
        .call(axis_y);

    console.log(chart_height);

    d3.select('#x-axis')
        .attr('transform', function(d) {
            return 'translate(0, ' + chart_height + ')'
        });

    // // adding rects that will serve as click targets for labels
    // d3.select('#y-axis')
    //     .selectAll('g')
    //   .classed('label', true)
    //     .append('rect')
    //   .data(data)
    //   .attr('class', 'label-click-target')
    //   .attr('category_name', function(d) {
    //         var category = d.city
    //         category = category.replace(/ /g, '_')
    //         return category
    //   })
    //   .attr('width', labels_width)
    //   .attr('height', scale_y.bandwidth())
    //   .attr('fill', 'yellow')
    //   .attr('opacity', 0)
    //   .attr('x', -labels_width)
    //   .attr('y', -scale_y.bandwidth() / 2)

}


var sort_chart = function() {

    var sort_function;
    if(ascending) {
        sort_function = function(a, b) {
            return a.rainfall - b.rainfall // larger goes first
        };
    } else {
        sort_function = function(a, b) {
            return b.rainfall - a.rainfall // smaller goes first
        };
    }

    scale_y.domain(dataset.sort(sort_function)
        .map(function(d) { return d.city; }))
        .copy();

    d3.selectAll("svg .draw_area .bar")
        .sort(sort_function);

    var transition = d3.select('svg').transition().duration(400)
    var delay = function(d, i) { return i * 30; };

    transition.selectAll(".bar")
        .attr('transform', function(d, i) {
            return 'translate(0, ' + (scale_y(d.city)) + ')';
        })
        .delay(delay)

    transition.select('#y-axis')
        .call(axis_y)
      .selectAll('g')
        .delay(delay)

}

// loading data and drawing
function type(d) {
    d.rainfall = +d.rainfall; // coercing rainfall to numeric
    return d;
}

d3.csv('rainfall.csv', type, draw);
