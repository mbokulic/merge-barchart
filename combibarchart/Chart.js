var Chart = function(html_wrapper) {
    Event_publisher.call(this);
    this.html_wrapper = html_wrapper;

    // state variables
    this.ascending = true;

    // drawing inside the wrapper
    this.svg = this.html_wrapper.append('svg')
        .attr('width', TOTAL_WIDTH)
        .attr('id', 'chart');
    this.draw_area = this.svg.append('g')
        .attr('id', 'draw-area')
        .attr('width', DRAW_WIDTH)
        .attr('transform', 'translate(' + MARGIN.left + ',' +  MARGIN.top + ')')
    this.tooltip = this.html_wrapper.append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style('width', '100px');

    this.scale_y = d3.scaleBand()
        .paddingInner(PADDING)
        .paddingOuter(PADDING / 2);
    this.scale_x = d3.scaleLinear();

    this.draw_area.append('g')
        .attr('id', 'x-axis');
    this.draw_area.append('g')
        .attr('id', 'y-axis');

    this.merger_handler = this.merger_handler.bind(this);

};

Chart.prototype = Object.create(Event_publisher.prototype);

Chart.prototype.draw = function(data) {

    var chart_height = data.length * BAR_HEIGHT;
    var max_value = d3.max(data, function(d) {return(d.value);})
    var self = this;

    this.svg.attr('height', chart_height + MARGIN.bottom + MARGIN.top);
    this.draw_area.attr('height', chart_height);

    this.scale_y
        .domain(data.map(function(d) {return d.category}))
        .rangeRound([0, chart_height]);
    this.scale_x
        .range([0, DRAW_WIDTH])
        .domain([0, max_value]);
    this.tooltip.style('height', this.scale_y.bandwidth() + 'px');

    axis_x = d3.axisBottom()
        .scale(this.scale_x)
        .tickSizeOuter(0)
        .tickSizeInner(8);
    axis_y = d3.axisLeft()
        .scale(this.scale_y)
        .tickSize(4);
    d3.select('#x-axis')
        .attr('transform', 'translate(0, ' + (chart_height) + ')')
        .call(axis_x);
    d3.select('#y-axis')
        .call(axis_y);

    this.draw_area
        .selectAll('.bar')
        .data(data, function(d) {return d.category})
        .exit()
        .on('click', null)
        .remove();

    this.draw_area.selectAll('.label-click-target')
        .on('click', null)
        .remove();

    this.draw_area.selectAll('.bar')
        .data(data, function(d) {return d.category})
        .enter()
      .append('g')
        .classed('bar', true)
        .attr('category_name', function(d) {
            return d.category
        })
        .on('mouseover', function(d, i) {
            self.tooltip.transition()
              .duration(200)
              .style('opacity', .7);
            self.tooltip
              .style('top', (self.scale_y(d.category) + MARGIN.top) + 'px')
              .style('left', (self.scale_x(d.value) + MARGIN.left) + 'px')
              .text(d.value + 'mm');
        })
        .on('mouseout', function(d) {
            self.tooltip.transition()
              .duration(300)
              .style('opacity', 0);
        })
        .on('click', this.bar_click_handler.bind(this))
      .append('rect')
        .attr('y', self.scale_y.padding() * 0.5)
        
        .attr('height', self.scale_y.bandwidth());

    this.draw_area.selectAll('.bar')
        .attr('transform', function(d, i) {
            return 'translate(0, ' + (self.scale_y(d.category)) + ')';})
      .selectAll('rect')
        .attr('width', function(d) {return self.scale_x(d.value);});

    d3.select('#y-axis')
        .selectAll('g')
      .classed('label', true)
        .append('rect')
      .data(data)
      .classed('label-click-target', true)
      .on('click', this.label_click_handler.bind(this))
      .attr('category_name', function(d) {
            return d.category
      })
      .attr('width', LABELS_WIDTH)
      .attr('height', self.scale_y.bandwidth())
      .attr('x', -LABELS_WIDTH)
      .attr('y', -self.scale_y.bandwidth() / 2)

}

Chart.prototype.bar_click_handler = function() {
    var target = d3.select(event.currentTarget);
    var category_name = target.attr('category_name');
    var highlighted = target.classed('highlight');
    target.classed('highlight', !highlighted)
    var parent = d3.selectAll(
        '.label rect[category_name="' + category_name + '"'
        ).node()
        .parentNode;
    d3.select(parent).classed('highlight', !highlighted);

    this.notify({
        action: 'category_click',
        data: {
            name: category_name,
            add: highlighted ? false : true
        }
    });
}

Chart.prototype.label_click_handler = function() {
    var target = event.currentTarget
    var parent = d3.select(target.parentNode);
    // category name is in the target
    var category_name = target.getAttribute('category_name');
    var highlighted = parent.classed('highlight')
    parent.classed('highlight', !highlighted);
    d3.selectAll('.bar[category_name="' + category_name + '"')
      .classed('highlight', !highlighted);

    this.notify({
        action: 'category_click',
        data: {
            name: category_name,
            add: highlighted ? false : true
        }
    });
};

Chart.prototype.merger_handler = function(event) {
    if(event.action === 'merge' | event.action === 'unmerge') {
        this.draw(event.data.dataset);
    };
};

var sort_chart = function() {

    var sort_function;
    if(ascending) {
        sort_function = function(a, b) {
            return a.value - b.value // larger goes first
        };
    } else {
        sort_function = function(a, b) {
            return b.value - a.value // smaller goes first
        };
    }

    scale_y.domain(dataset.sort(sort_function)
        .map(function(d) { return d.category; }))
        .copy();

    d3.selectAll("svg #draw-area .bar")
        .sort(sort_function);

    var transition = d3.select('svg').transition().duration(400)
    var delay = function(d, i) { return i * 30; };

    transition.selectAll(".bar")
        .attr('transform', function(d, i) {
            return 'translate(0, ' + (scale_y(d.category)) + ')';
        })
        .delay(delay)

    transition.select('#y-axis')
        .call(axis_y)
      .selectAll('g')
        .delay(delay)

}
