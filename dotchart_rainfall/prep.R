# precip

#  - dotchart, sorted ascending
#  - 80/20: put a line or color the 80% of total precipitation
#  (this makes little sense since not all cities are there)
#  - color by state


data = data.frame(city = names(precip), rainfall = precip)
data = data[order(data$rainfall), ]
dotchart(data$rainfall, labels=data$city)

# drawing a line through the 80%
cumulative = cumsum(data$rainfall) / sum(data$rainfall)
abline(v = min(data$rainfall[cumulative < 0.8]))

# saving the csv
setwd('~/Documents/learn/d3_dotchart')
write.csv(data, 'rainfall.csv', row.names=FALSE, quote=FALSE)