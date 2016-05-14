// this code assumes that data is sorted

var margin = {top: 100, right: 10, bottom: 20, left: 10};
var text_width = 100;
margin.left += text_width; // adding hardcoded text width to margin
var total_width = 700;
var chart_width = total_width - margin.left - margin.right // active chart dimensions

// height of each "row" in the chart
// will influence total chart height depending on nr of rows in the dataset
var g_height = 14; 

var svg = d3.select('body')
  .append('svg')
    .attr('width', total_width);

svg.append('text')
    .attr('class', 'title')
    .text('Precipitation in US and Puerto Rico cities')
    .attr('x', chart_width / 2 + margin.left)
    .attr('y', 40)
    .attr('text-anchor', 'middle');

var draw_area = svg.append('g')
    .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
    .attr('class', 'dotchart');

var scale_x = d3.scale.linear()
    .range([0, chart_width]);

var draw_dotchart = function(error, data) {
    scale_x.domain([0, d3.max(data, function(d) { return(d.rainfall); })]);

    // setting height based on the number of data points
    var chart_height = data.length * g_height;
    svg.attr('height', chart_height + margin.top + margin.bottom);

    var scale_y = d3.scale.ordinal()
        .domain(data.map(function(d) { return d.city }))
        .rangeRoundBands([0, chart_height], 0.4);
        // .rangePoints([0, chart_height]);

    var chart_elements = d3.select('.dotchart')
        .selectAll('g')
        .data(data)
        .enter()
      .append('g')
        .attr('transform', function(d, i) {
            return 'translate(0, ' + (scale_y(d.city) + scale_y.rangeBand() * 0.5) + ')';})
      .append('circle')
        .attr('cx', function(d) {return scale_x(d.rainfall); })
        .attr('r', scale_y.rangeBand() / 2)
        // .attr('r', 11 / 2)
        .attr('cy', 0);
    
    // // helper rectangles
    // chart.append('rect')
    //     .attr('x', 0)
    //     .attr('y', 0)
    //     .attr('width', chart_width)
    //     .attr('height', g_height)
    //     .attr('fill', function(d, i) {if(i % 2 === 0) {
    //         return 'limegreen' 
    //     } else {
    //         return 'yellow'
    //     }});

    // adding the x axis
    var axis_x = d3.svg.axis()
        .scale(scale_x)
        .orient('top')

    draw_area.append('g')
        .attr('class', 'x axis')
        // .attr('transform', 'translate(0, ' + (chart_height + 10) + ')')
        .attr('transform', 'translate(0, ' + 0 + ')')
        .call(axis_x)
      .append("text")
        .attr("x", chart_width / 2)
        .attr("dy", "-3em")
        .style("text-anchor", "middle")
        .text("Average precipitation in inches");

    // adding gridlines along x
    var gridlines_x = d3.svg.axis()
        .scale(scale_x)
        .orient('bottom')
        .tickSize(-chart_height); // negative value will make ticks extend upward

    draw_area.append('g')
        .attr('class', 'gridlines x')
        .attr('transform', 'translate(0,' + chart_height + ')')
        .call(gridlines_x);

    // adding the y axis, on top because the chart is very tall
    var axis_y = d3.svg.axis()
        .scale(scale_y)
        .orient("left");

    draw_area.append('g')
        .attr('class', 'y axis')
        .call(axis_y);

    // adding gridlines along y
    var gridlines_y = d3.svg.axis()
        .scale(scale_y)
        .orient('left')
        .tickSize(-chart_width);

    draw_area.append('g')
        .attr('class', 'gridlines y')
        .call(gridlines_y);

    // // using html elements for displaying the y-axis text
    // // html has good capabilities for dealing with text align and overflow
    // // this would require more fiddling, but I abandoned it for the more 
    // // straightforward d3 axis option
    // d3.select('body').selectAll('div')
    //     .data(data)
    //     .enter()
    //   .append('div')
    //     .attr('class', 'city_name')
    //     .style('line-height', g_height + 'px') // need to set to use vert align
    //     .style('height', g_height)
    //     .style('top', function(d, i) { return (i * g_height + margin.top) + 'px'; })
    //     .style('position', 'absolute')
    //     .style('width', text_width)
    //     .html(function(d) {return d.city;})
    //     .attr('title', function(d) {return d.city;});

}

function type(d) {
  d.rainfall = +d.rainfall; // coercing rainfall to numeric
  return d;
}

d3.csv('rainfall.csv', type, draw_dotchart);
