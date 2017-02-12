var Chart = function(html_wrapper) {
    Event_publisher.call(this);
    this.html_wrapper = html_wrapper;

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

    this.draw_area.append('g')
        .attr('id', 'x-axis');
    this.draw_area.append('g')
        .attr('id', 'y-axis');


    this.init_properties();
    this.merger_handler = this.merger_handler.bind(this);
    this.menu_handler = this.menu_handler.bind(this);
    this.data = null;

};

Chart.prototype = Object.create(Event_publisher.prototype);

Chart.prototype.init_properties = function() {
    this.scale_y = d3.scaleBand()
        .paddingInner(PADDING)
        .paddingOuter(PADDING / 2);
    this.scale_x = d3.scaleLinear();

    this.axis_x = d3.axisBottom()
        .tickSizeOuter(0)
        .tickSizeInner(8);
    this.axis_y = d3.axisLeft()
        .tickSize(4);

};

Chart.prototype.draw = function(data) {
    this.data = data;

    var self = this;

    var chart_height = data.length * BAR_HEIGHT;
    var max_value = d3.max(data, function(d) {return(d.value);})
    this.set_chart_dimensions(chart_height);
    this.set_scale_ranges(chart_height, max_value);
    this.draw_axes();
    this.tooltip.style('height', this.scale_y.bandwidth() + 'px');
    var selection = this.draw_bars();
    this.transform_bars(selection);

    d3.select('#x-axis')
        .attr('transform', 'translate(0, ' + (chart_height) + ')');

}

Chart.prototype.set_chart_dimensions = function(chart_height) {
    this.svg.attr('height', chart_height + MARGIN.bottom + MARGIN.top);
    this.draw_area.attr('height', chart_height);
};

Chart.prototype.set_scale_ranges = function(chart_height, max_value) {
    this.scale_y
        .domain(this.data.map(function(d) {return d.category}))
        .rangeRound([0, chart_height]);
    this.scale_x
        .range([0, DRAW_WIDTH])
        .domain([0, max_value]);
};

Chart.prototype.draw_axes = function() {
    this.axis_x = d3.axisBottom().scale(this.scale_x)
    this.axis_y = d3.axisLeft().scale(this.scale_y)
    d3.select('#x-axis').call(this.axis_x);
    d3.select('#y-axis')
        .call(this.axis_y)
        .selectAll('g')
      .classed('label', true)
        .append('rect')
      .data(this.data)
      .classed('label-click-target', true)
      .on('click', this.label_click_handler.bind(this))
      .attr('category_name', function(d) {
            return d.category
      })
      .attr('width', LABELS_WIDTH)
      .attr('height', this.scale_y.bandwidth())
      .attr('x', -LABELS_WIDTH)
      .attr('y', -this.scale_y.bandwidth() / 2);

};

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

Chart.prototype.draw_merge = function(data, merge_into) {
    this.data = data;
    var self = this;
    var exit_sel  = this.draw_area
        .selectAll('.bar')
        .data(data, function(d) {return d.category})
        .exit()

    var max_exit_value = d3.max(
        exit_sel.data(),
        function(d) {return self.scale_x(d.value)}
    );

    var new_height = this.scale_y(merge_into);
    var count = 0;
    exit_sel.on('click', null)
        .classed('highlight', false)
        .transition()
        .attr('transform', function(d) {
            return 'translate(0, ' + new_height + ')';})
        .duration(300)
        .remove()
        .each(function() {count++;})
        .on('end', function(transition) {
            count--;
            if(count == 0) {self.redraw_after_merge(max_exit_value);};
        });

};

Chart.prototype.redraw_after_merge = function(start_width) {
    var chart_height = this.data.length * BAR_HEIGHT;
    var max_value = d3.max(this.data, function(d) {return(d.value);})

    this.set_scale_ranges(chart_height, max_value);
    var selection = this.draw_bars();
    this.transform_bars(selection, start_width);
    this.draw_axes();

    var transition = this.draw_area.transition().duration(300);
    this.transform_bars(transition.selectAll('.bar'));
    transition.select('#x-axis').attr('transform',
                                      'translate(0, ' + chart_height + ')');

};

Chart.prototype.draw_unmerge = function(data, cat_name) {
    this.data = data;
    var self = this;

    var chart_height = this.data.length * BAR_HEIGHT;
    var max_value = d3.max(this.data, function(d) {return(d.value);})
    
    // getting params for the old category and removing it
    var old_y = this.scale_y(cat_name);
    var exit_selection = d3.selectAll('.bar')
        .data(this.data, function(d) {return d.category})
        .exit()
    var old_x = exit_selection.select('rect').attr('width');
    exit_selection.on('click', null).remove();

    // bars that comprised the merged category stay in the same place
    this.scale_y
        .domain(this.data.map(function(d) {return d.category}))
        .rangeRound([0, chart_height]);
    var new_bars = this.draw_bars();
    var new_rects = new_bars
      .attr('transform', 'translate(0, ' + old_y + ')')
      .selectAll('rect')
    new_rects.filter(function(d) {
          if(self.scale_y(d.category) === old_y) {
              return false;
          } else {
              return true;
          }})
        .attr('width', function(d) {return self.scale_x(d.value)});
    new_rects
      .filter(function(d) {
          if(self.scale_y(d.category) === old_y) {
              return true;
          } else {
              return false;
          }})
        .attr('width', old_x);

    // moving the bars along the y-axis
    var count = 0;
    var t = d3.transition()
        .duration(300);

    d3.selectAll('.bar').transition(t)
        .attr('transform', function(d) {
            return 'translate(0, ' + self.scale_y(d.category) + ')';
        })
        .each(function() {count++})
        .on('end', function() {
            count--;
            if(count === 0) {
                self.scale_x
                    .domain([0, max_value])
                    .range([0, DRAW_WIDTH]);
                self.draw_axes();
                d3.selectAll('.bar').selectAll('rect')
                    .transition().duration(300)
                    .attr('width', function(d) {return self.scale_x(d.value)})
            }
        });
    d3.select('#x-axis').transition(t)
        .attr('transform', 'translate(0, ' + chart_height + ')');






};

Chart.prototype.draw_bars = function() {
    var self = this;
    var selection = this.draw_area.selectAll('.bar')
        .data(this.data, function(d) {return d.category})
        .enter()
      .append('g')
        .classed('bar', true)
        .attr('category_name', function(d) {
            return d.category
        })
        .on('mouseover', function(d, i) {
              self.tooltip
                  .style('top', (self.scale_y(d.category) + MARGIN.top) + 'px')
                  .style('left', (self.scale_x(d.value) + MARGIN.left) + 'px')
                  .text(d.value + 'mm')
                .transition()
                  .duration(200)
                  .style('opacity', .7);
        })
        .on('mouseout', function(d) {
            self.tooltip.transition()
              .duration(300)
              .style('opacity', 0);
        })
        .on('click', this.bar_click_handler.bind(this))
    selection.append('rect')
        .attr('y', self.scale_y.padding() * 0.5)
        .attr('height', self.scale_y.bandwidth());
    return selection;
};

Chart.prototype.transform_bars = function(d3_selection, start_width=null) {
    var self = this;
    d3_selection
        .attr('transform', function(d, i) {
            return 'translate(0, ' + (self.scale_y(d.category)) + ')';})
      .selectAll('rect')
        .attr('width', start_width ? start_width : function(d) {
          return self.scale_x(d.value);
        });
};

Chart.prototype.merger_handler = function(event) {
    if(event.action === 'merge') {
        this.draw_merge(event.data.dataset, event.data.merge_into);
    };

    if(event.action === 'unmerge') {
        this.draw_unmerge(event.data.dataset, event.data.name);
    };
};

Chart.prototype.menu_handler = function(event) {
    if(event.action === 'sort') {
        var sort_function;
        if(event.data.ascending) {
            sort_function = function(a, b) {
                return a.value - b.value // larger goes first
            };
        } else {
            sort_function = function(a, b) {
                return b.value - a.value // smaller goes first
            };
        }

        this.scale_y.domain(this.data.sort(sort_function)
            .map(function(d) { return d.category; }))
            .copy();

        d3.selectAll("svg #draw-area .bar")
            .sort(sort_function);

        var transition = d3.select('svg').transition().duration(400)
        var delay = function(d, i) { return i * 30; };

        var self = this;
        transition.selectAll(".bar")
            .attr('transform', function(d, i) {
                return 'translate(0, ' + (self.scale_y(d.category)) + ')';
            })
            .delay(delay)

        axis_y = d3.axisLeft()
            .scale(this.scale_y)
            .tickSize(4);

        transition.select('#y-axis')
            .call(axis_y)
          .selectAll('g')
            .delay(delay);

    };
};
