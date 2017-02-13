// chart dimensions
var TOTAL_WIDTH = 700;
var MARGIN = {top: 20, right: 20, bottom: 40, left: 20};
var LABELS_WIDTH = 150;
MARGIN.left += LABELS_WIDTH; // adding label width to MARGIN
var DRAW_WIDTH = TOTAL_WIDTH - MARGIN.left - MARGIN.right 

// height of the elements and the padding between them
var BAR_HEIGHT = 40; 
var PADDING = 0.25;

// setting elements that stay constant
var wrapper = d3.select('#chart-wrapper')
    .style('width', TOTAL_WIDTH + 'px');

// merger is the model and chart/menu are the views
var merger = new Merger();
var chart = new Chart(wrapper);
var menu = new Menu(d3.select('#panel'));
merger.subscribe(chart.merger_handler, chart);
merger.subscribe(menu.merger_handler, menu);
chart.subscribe(merger.chart_handler, merger);
menu.subscribe(chart.menu_handler, chart);
menu.subscribe(merger.menu_handler, menu);

// loading data and drawing
function type(d) {
    d.value = +d.value; // coercing value to numeric
    return d;
}
d3.csv('js/data.csv', type, function data_callback(error, data) {
    chart.draw(data);
    merger.init(data);
});
