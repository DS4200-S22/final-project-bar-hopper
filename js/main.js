// Utility function to calculate distance between two points
function distance(location1, location2) {
    const R = 6371e3;
    const lat1 = location1.lat * Math.PI / 180; // lat1, lat2 in radians
    const lat2 = location2.lat * Math.PI / 180;
    const latDiff = (location2.lat - location1.lat) * Math.PI / 180;
    const longDiff = (location2.long - location1.long) * Math.PI / 180;

    const a = Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(longDiff / 2) * Math.sin(longDiff / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Utility function to calculate angle (in degrees) between two points
function bearing(location1, location2) {
    const lat1 = location1.lat * Math.PI / 180; // lat1, lat2, long1, long2 in radians
    const lat2 = location2.lat * Math.PI / 180;
    const long1 = location1.long * Math.PI / 180;
    const long2 = location2.long * Math.PI / 180;
    const y = Math.sin(long2 - long1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(long2 - long1);
    const θ = Math.atan2(y, x);
    const brng = (θ * 180 / Math.PI + 360) % 360; // in degrees
    return brng;
}

// Finds dots within the brushed region
function isBrushed(x0, x1, y0, y1, cx, cy) {
    return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1; // This return TRUE or FALSE depending on if the points is in the selected area
}

const permissionElement = document.getElementById("permission-message");
const latitudeElement = document.getElementById("vis-latitude-input");
const longitudeElement = document.getElementById("vis-longitude-input");
const locationElement = document.getElementById("vis-radial-locate-me");
const closestBarElement = document.getElementById("closet-bar");
const closestDistanceElement = document.getElementById("closet-dist");



function showLatitude(latitude) {
    latitudeElement.value = `latitude: ${latitude}`;
}

function showLongitude(longitude) {
    longitudeElement.value = `longitude: ${longitude}`;
}

function showClosestBar({name, dist}) {
    closestBarElement.innerHTML = `Closest Bar Name: ${name}`;
    closestDistanceElement.innerHTML = `Distance(km): ${dist}`;
}

function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            permissionElement.innerHTML = "User denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            permissionElement.innerHTML = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            permissionElement.innerHTML = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            permissionElement.innerHTML = "An unknown error occurred.";
            break;
    }
}

// High level variables to reference in linking visualizations
let currentlyUsing;
let barHours;

(function () {
    d3.json("https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/boston.geojson").then(function (mapData) {
        d3.csv("https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/final_merged_data.csv").then(function (mergedData) {
            currentlyUsing = mergedData[0];

            // Map Dimension and Projection
            const widthMap = 500;
            const heightMap = 500;
            const projection_map = d3.geoMercator()
                .fitSize([widthMap, heightMap], mapData);

            // Scatter Dimension and Margin
            const widthScatter = 400;
            const heightScatter = 350;
            const margin_scatter = { top: 25, right: 25, bottom: 15, left: 15 };
            const innerWidthScatter = widthScatter - margin_scatter.left - margin_scatter.right;
            const innerHeightScatter = heightScatter - margin_scatter.top - margin_scatter.bottom;
            const k = heightScatter / widthScatter;

            // Sets up tool tip for the visualization
            const tooltip = d3.select("#tooltip")
                .append("div")
                .style("opacity", 0)
                .attr("class", "tooltip")
                .style("border", "solid")
                .style("border-width", "1px")
                .style("border-radius", "5px")
                .style("padding", "10px");

            const mouseover = function () {
                tooltip.style("opacity", 1);
            }
            let mousemove = function (event, d) {
                tooltip.html("This establishment is: " + d.name + "<br> Price: " + d.price + "<br> Rating: " + d.rating + "<br> Review Counts:" + d["review_count"])
                    .style("left", (event.pageX + 10) + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
                    .style("top", (event.pageY - 45) + "px");
            }
            const mouseleave = function () {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0);
            }

            // Sets up channels
            const color = {
                "$": "#eb4034",
                "$$": "#1c03fc",
                "$$$": "#6eeb34",
                "$$$$": "#34ebdc",
            };

            // Sets up filter check boxes
            const rating_choices = new Set();
            const price_choices = new Set();

            function updateRatingChoices({ checked, value }) {
                if (checked) rating_choices.add(value);
                else rating_choices.delete(value);
            }

            function updatePriceChoices({ checked, value }) {
                if (checked) price_choices.add(value);
                else price_choices.delete(value);
            }

            d3.selectAll(".price").on("change", ({ target }) => {
                updatePriceChoices(target);
                updateAll();
            });

            d3.selectAll(".rating").on("change", ({ target }) => {
                updateRatingChoices(target);
                updateAll();
            });

            // Time Dimension
            const widthTime = 250;
            const heightTime = 385;
            const margin = { left: 40, right: 25, bottom: 25, top: 25 };

            // Set up d3 time formatting
            const dayFormatter = d3.timeFormat("%w");
            const weekFormatter = d3.timeFormat("%U");
            const hourFormatter = d3.timeFormat("%X");
            const yAxisFormatter = d3.timeFormat("%m/%d");

            // Chart settings
            let presets = {
                zoom: 20,
                userSize: 10,
                rangeSize: 100
            };

            // Radial Dimension
            const widthRadial = 400;
            const heightRadial = 300;

            // Svg Map
            let svgMap;
            let circlesMap;
            let brushMap;
            let brushXMap;
            let brushYMap;

            // Svg Scatter
            let gDot;
            let xScaleScatter;
            let yScaleScatter;

            // Svg Time
            let svgTime;

            // Svg Radar
            let svgRadar;

            // Svg Radial
            let svgRadial; // Sets the viewbox of the svg
            const center = {
                x: widthRadial / 2,
                y: heightRadial / 2,
            };
            // Default NEU Snell location
            let currentLocation = {
                lat: 42.3505,
                long: -71.1054,
            };

            // Display data for radial and scatter plots
            let filteredData = mergedData;

            // Function that creates the time graph for the selected bar
            function createTimeGraph() {
                const tagIdTime = "#vis-timechart";
                // Delete old time chart and replace with new
                d3.select(tagIdTime).selectAll("svg").remove();

                svgTime = d3.select(tagIdTime)
                    .append("svg")
                    .attr("width", widthTime + margin.right + margin.left)
                    .attr("height", heightTime + margin.top + margin.bottom)
                    .append("g")
                    .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

                const convertToValidTimeString = (input, overnight = "False") => {
                    let toReturn;
                    toReturn = input.substring(0, 2) + ':' + input.substring(2, 4) + ':00';

                    if ("True" === overnight) {
                        toReturn = "23:59:00";
                    }

                    return toReturn;
                };

                // Creates date object out of formatted time
                const dataFormatter = d3.timeParse('%H:%M:%S');

                // The actual date is irrelevant, only intiallized because d3 works better with date()
                // Obects, will only display times and the day string
                barHours = [{
                    day: 'Mon',
                    open: dataFormatter(convertToValidTimeString(currentlyUsing.mon_start)),
                    close: dataFormatter(convertToValidTimeString(currentlyUsing.mon_end, currentlyUsing.mon_overnight))
                },
                {
                    day: 'Tues',
                    open: dataFormatter(convertToValidTimeString(currentlyUsing.tues_start)),
                    close: dataFormatter(convertToValidTimeString(currentlyUsing.tues_end, currentlyUsing.tues_overnight))
                },
                {
                    day: 'Wed',
                    open: dataFormatter(convertToValidTimeString(currentlyUsing.wed_start)),
                    close: dataFormatter(convertToValidTimeString(currentlyUsing.wed_end, currentlyUsing.wed_overnight))
                },
                {
                    day: 'Thurs',
                    open: dataFormatter(convertToValidTimeString(currentlyUsing.thurs_start)),
                    close: dataFormatter(convertToValidTimeString(currentlyUsing.thurs_end, currentlyUsing.thurs_overnight))
                },
                {
                    day: 'Fri',
                    open: dataFormatter(convertToValidTimeString(currentlyUsing.fri_start)),
                    close: dataFormatter(convertToValidTimeString(currentlyUsing.fri_end, currentlyUsing.fri_overnight))
                },
                {
                    day: 'Sat',
                    open: dataFormatter(convertToValidTimeString(currentlyUsing.sat_start)),
                    close: dataFormatter(convertToValidTimeString(currentlyUsing.sat_end, currentlyUsing.sat_overnight))
                },
                {
                    day: 'Sun',
                    open: dataFormatter(convertToValidTimeString(currentlyUsing.sun_start)),
                    close: dataFormatter(convertToValidTimeString(currentlyUsing.sun_end, currentlyUsing.sun_overnight))
                }
                ];

                // Set up date range axis
                let firstDay = d3.timeDay.floor(new Date(barHours[0].open));
                let lastDay = d3.timeDay.ceil(new Date(barHours[barHours.length - 1].close));
                let dateRange = [d3.min(barHours, function (d) { return d3.timeDay.floor(new Date(d.open)) }),
                d3.max(barHours, function (d) { return d3.timeDay.ceil(new Date(d.close)) })
                ];

                let xScale = d3.scaleTime()
                    .domain([0, 24])
                    .range([0, widthTime]);

                let yScale = d3.scaleTime()
                    .domain(dateRange)
                    .range([0, heightTime]);

                // Use days for y axis
                let yScaleDays = d3.scaleBand()
                    .domain(barHours.map(function (d) { return d.day }))
                    .range([0, heightTime]);

                let fullScale = d3.scaleTime()
                    .domain([d3.timeHour(new Date(2014, 0, 1, 0, 0, 0)),
                    d3.timeHour(new Date(2014, 0, 2, 0, 0, 0)),
                    ])
                    .range([0, widthTime]);

                // X axis
                svgTime.append("g")
                    .attr("transform", "translate(0," + heightTime + ")")
                    .call(d3.axisBottom(xScale)
                        .scale(fullScale)
                        .tickFormat(d3.timeFormat("%H:%M")));

                // Y axis
                svgTime.append("g")
                    .call(d3.axisLeft(yScaleDays));

                // Creates the tooltip that shows up when a bar is hovered
                const tooltip = d3.select("#vis-timechart")
                    .append("div")
                    .attr("class", "tooltip");

                // Event handler for when the bar is moused over, shows the tooltip
                const mouseover = function (event, d) {
                    tooltip.html("Day: " + d.day + "<br> Open: " + d.open.toLocaleTimeString() +
                        "<br> Close: " + d.close.toLocaleTimeString() + "<br>")
                        .style("opacity", 1);
                }

                // Event handler for the when the mouse is moving along the bar, tooltip moves with it
                const mousemove = function (event, d) {
                    tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 45) + "px");
                }

                // Event handler for when the mouse is done hovering over a bar
                const mouseleave = function (event, d) {
                    tooltip.style("opacity", 0);
                }

                // Create actual bar graphs
                svgTime.append("g")
                    .selectAll("rect")
                    .data(barHours)
                    .enter()
                    .append("rect")
                    .attr("class", "time-bar")
                    .attr("x", function (d) {
                        let h = hourFormatter(new Date(d.open)).split(":"), // changes datum from string, to proper Date Object, back to hour string and splits
                            xh = parseFloat(h[0]) + parseFloat(h[1] / 60); // time (hour and minute) as decimal
                        return xScale(xh);
                    })
                    //.attr("y", function (d) { return yScale(d3.timeDay.floor(new Date(d.open))) })
                    .attr("y", function (d) { return yScaleDays(d.day) })
                    .attr("width", function (d) {
                        let hstart = new Date(d.open),
                            hstop = new Date(d.close);
                        return xScale((hstop - hstart) / 3600000); // divide to convert to hours
                    })
                    .attr("height", 30)
                    .attr("rx", 10)
                    .attr("ry", 10)
                    .on("mouseover", mouseover)
                    .on("mousemove", mousemove)
                    .on("mouseleave", mouseleave);

                // Delete previous data and add bar name
                d3.select("#bar-name").select("h1").remove();
                d3.select("#bar-name")
                    .append("h1")
                    .append("a")
                    .attr("href", currentlyUsing.url)
                    .text(currentlyUsing.name);
            };

            // Create graphs on initial load for the default first record
            createTimeGraph();

            // Sets Up Main map
            {
                // Sets up the initial svg
                const tagId_map = "#vis-map";
                svgMap = d3.select(tagId_map)
                    .append("svg")
                    .attr("width", widthMap)
                    .attr("height", heightMap);
                let g_map = svgMap.append("g");

                // Draw the map
                g_map.selectAll("path")
                    .data(mapData.features)
                    .join("path")
                    .attr("fill", "#b8b8b8")
                    .attr("d", d3.geoPath()
                        .projection(projection_map)
                    )
                    .style("stroke", "black")
                    .style("opacity", .3);

                // Sets up brush
                long1 = projection_map.invert([0, 0])[0];
                long2 = projection_map.invert([widthMap, 0])[0];
                lat1 = projection_map.invert([0, 0])[1];
                lat2 = projection_map.invert([0, heightMap])[1];
                brushXMap = d3.scaleLinear()
                    .range([0, widthMap])
                    .domain([long1, long2]);
                brushYMap = d3.scaleLinear()
                    .range([0, heightMap])
                    .domain([lat1, lat2]);
                brushMap = d3.brush()
                    .extent([
                        [0, 0],
                        [widthMap, heightMap]
                    ])
                    .on("start", brushClear)
                    .on("brush", brushUpdate);
                svgMap.call(brushMap);
            }

            // Sets up Scatter plot
            {
                const tagId = '#vis-scatter';
                const svg = d3.select(tagId)
                    .append("svg")
                    .attr("width", innerWidthScatter) // Sets the width of the svg
                    .attr("height", innerHeightScatter) // Sets the height of the svg
                    .attr("viewBox", [0, 0, widthScatter, heightScatter]); // Sets the viewbox of the svg

                const gx = svg.append('g');

                const gy = svg.append('g');

                const gGrid = svg.append('g');

                gDot = svg.append('g')
                    .attr('fill', 'none')
                    .attr('stroke-linecap', 'round');

                // Sets up x-axis
                const xTick = 11;
                const xKey = 'Review Rating';
                let xMax = d3.max(mergedData, d => {
                    return parseInt(d['rating'])
                });
                let xMin = d3.min(mergedData, d => {
                    return parseInt(d['rating'])
                });
                xScaleScatter = d3.scaleLinear()
                    .domain([xMin - 0.5, xMax])
                    .range([margin_scatter.left, widthScatter - margin_scatter.right]);
                xAxis = (g, x) => g
                    .attr("transform", `translate(0,${heightScatter - margin_scatter.bottom})`)
                    .call(d3.axisTop(x).ticks(xTick))
                    .call(g => g.select(".domain").attr("display", "none"));
                gx.call(g => g.append("text")
                    .attr('x', widthScatter - margin_scatter.right)
                    .attr('y', margin_scatter.bottom - 5)
                    .attr('font-size', '15px')
                    .attr('fill', 'black')
                    .attr('text-anchor', 'end')
                    .text(xKey)
                );

                // Sets up y-axis
                const yKey = 'Review Count';
                const yMax = d3.max(mergedData, d => {
                    return parseInt(d['review_count'])
                });
                yScaleScatter = d3.scaleLinear()
                    .domain([-100, yMax * 1.05])
                    .range([heightScatter - margin_scatter.bottom, margin_scatter.top]);
                yAxis = (g, y) => g
                    .attr('transform', `translate(${margin_scatter.left}, 0)`)
                    .call(d3.axisRight(y).ticks(xTick * k))
                    .call(g => g.select(".domain").attr("display", "none"));
                gy.call(g => g.append('text')
                    .attr('x', margin_scatter.left + yKey.length * 6)
                    .attr('y', margin_scatter.top - 5)
                    .attr('font-size', '15px')
                    .attr('fill', 'black')
                    .attr('text-anchor', 'end')
                    .text(yKey)
                );

                // Sets up zoom
                const zoom = d3.zoom()
                    .scaleExtent([0.5, 30])
                    .on("zoom", zoomed);

                function zoomed({ transform }) {
                    const zx = transform.rescaleX(xScaleScatter).interpolate(d3.interpolateRound);
                    const zy = transform.rescaleY(yScaleScatter).interpolate(d3.interpolateRound);
                    gDot.attr("transform", transform).attr("stroke-width", 8 / transform.k);
                    gx.call(xAxis, zx);
                    gy.call(yAxis, zy);
                    gGrid.call(grid, zx, zy);
                }

                // Sets up grid
                const grid = (g, x, y) => g
                    .attr("stroke", "currentColor")
                    .attr("stroke-opacity", 0.1)
                    .call(g => g
                        .selectAll(".x")
                        .data(x.ticks(xTick))
                        .join(
                            enter => enter.append("line").attr("class", "x").attr("y2", heightScatter),
                            update => update,
                            exit => exit.remove()
                        )
                        .attr("x1", d => 0.5 + x(d))
                        .attr("x2", d => 0.5 + x(d)))
                    .call(g => g
                        .selectAll(".y")
                        .data(y.ticks(xTick * k))
                        .join(
                            enter => enter.append("line").attr("class", "y").attr("x2", widthScatter),
                            update => update,
                            exit => exit.remove()
                        )
                        .attr("y1", d => 0.5 + y(d))
                        .attr("y2", d => 0.5 + y(d)));

                const resetZoom = () => {
                    svg.transition()
                        .duration(750)
                        .call(zoom.transform, d3.zoomIdentity);
                }

                document.getElementById("vis-scatter-zoom-reset").addEventListener('click', resetZoom);

                svg.call(zoom).call(zoom.transform, d3.zoomIdentity);
            }

            // Sets up radial graph
            {
                const tagIdRadial = "#vis-radial";
                // Delete old radial graph and replace with new
                svgRadial = d3.select(tagIdRadial)
                    .append("svg")
                    .attr("width", widthRadial) // Sets the width of the svg
                    .attr("height", heightRadial) // Sets the height of the svg
                    .attr("viewBox", [0, 0, widthRadial, heightRadial]); // Sets the viewbox of the svg
            }

            // Sets up brush functions
            function brushClear() {
                svgMap.call(brushMap.move, null);
            }

            function brushUpdate(brushEvent) {
                if (brushEvent !== null && brushEvent.selection !== null) {
                    // brushed data points
                    let brushed = []
                    // Find coordinates of brushed region 
                    const brushCoords = brushEvent.selection;
                    const x0 = brushCoords[0][0];
                    const x1 = brushCoords[1][0];
                    const y0 = brushCoords[0][1];
                    const y1 = brushCoords[1][1];
                    svgMap.selectAll("circle")
                        .classed("selected", (d) => {
                            if (isBrushed(x0, x1, y0, y1, brushXMap(parseFloat(d["longitude"])), brushYMap(parseFloat(d["latitude"])))) {
                                brushed.push(d);
                                return true;
                            }
                            return false;
                        })
                    filteredData = brushed.length > 0 ? brushed : mergedData;
                    paintScatterPlot();
                    paintRadialPlot();
                }
            }


            // Redraw Map, Scatter, Radial
            function updateAll() {
                // Filters the data
                if (price_choices.size > 0) newData = mergedData.filter((d, i) => price_choices.has(d["price"]));
                if (rating_choices.size > 0) newData = mergedData.filter((d, i) => rating_choices.has(d["rating"]));
                newData = price_choices.size + rating_choices.size > 0 ? newData : mergedData;

                // Paints the map
                circlesMap = svgMap.selectAll("circle")
                    .data(newData, d => d["id"]);
                circlesMap.enter()
                    .append("circle")
                    .attr("class", d => "p" + d.price.length + " r" + d.rating * 10) // price and rating classes
                    .attr("id", (d) => d.id) // unique id
                    .attr("cx", d => projection_map([d.longitude, d.latitude])[0])
                    .attr("cy", d => projection_map([d.longitude, d.latitude])[1])
                    .attr("r", 6)
                    .style('fill', d => color[d["price"]] || "black")
                    .attr("stroke", "#000000")
                    .on("mouseover", mouseover)
                    .on("mousemove", mousemove)
                    .on("mouseleave", mouseleave)
                    .on("click", function (event, d) {
                        // Pass data to other charts
                        currentlyUsing = d;
                        createTimeGraph();
                    });
                circlesMap.exit()
                    .remove();

                filteredData = newData;
                paintScatterPlot();
                paintRadialPlot();
            }

            // Paints the scatter plot
            function paintScatterPlot() {
                circlesScatter = gDot.selectAll("path")
                    .data(filteredData, d => d["id"]);;
                circlesScatter.enter()
                    .append("path")
                    .attr("id", d => d.id)
                    .attr("d", d => `M${xScaleScatter(d['rating'] || 0)},${yScaleScatter(d['review_count'] || 0)}h0`)
                    .attr("stroke", d => color[d['price']] || 'black')
                    .attr('r', 8)
                    .on("mouseover", mouseover)
                    .on("mousemove", mousemove)
                    .on("mouseleave", mouseleave);
                circlesScatter.exit()
                    .remove();
            }

            const mousemoveRadial = function (event, d) {
                tooltip.html("This establishment is: " + d.name + "<br> Distance(km): " + (Math.round(d.dist * 100) / 100) + "<br> Bearing: " + (Math.round((d.bearing - 270) * 100) / 100))
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 45) + "px");
            }

            // Paints the radial plot
            function paintRadialPlot() {
                const radialData = [];
                const closestBar = {
                    dist: Infinity,
                    name: '',
                }
                const maxDist = d3.max(filteredData, d => {
                    const { latitude, longitude } = d;
                    return distance(currentLocation, { lat: latitude, long: longitude });
                });
                filteredData.forEach(d => {
                    const { latitude, longitude } = d;
                    const barLocation = {
                        lat: latitude,
                        long: longitude,
                    };
                    const dist = distance(currentLocation, barLocation) / maxDist;
                    const bear = bearing(currentLocation, barLocation) + 270;
                    const x = dist * (widthRadial / 2 - 4) * Math.cos(bear * Math.PI / 180) + center.x;
                    const y = dist * (heightRadial / 2 - 4) * Math.sin(bear * Math.PI / 180) + center.y;
                    if (closestBar.dist > dist * maxDist) {
                        closestBar.dist = dist * maxDist;
                        closestBar.name = d["name"]
                    }
                    radialData.push({
                        ...d,
                        x,
                        y,
                        dist: dist * maxDist,
                        bearing: bear,
                    });
                });
                // Remove and draw the circles
                svgRadial.selectAll("circle")
                    .remove();
                circlesRadial = svgRadial.selectAll("circle")
                    .data(radialData, d => d["id"]);
                circlesRadial.enter()
                    .append("circle")
                    .attr("id", d => d["id"])
                    .attr("cx", d => d["x"])
                    .attr("cy", d => d["y"])
                    .attr("fill", d => color[d['price']] || 'black')
                    .attr('r', 4)
                    .on("mouseover", mouseover)
                    .on("mousemove", mousemoveRadial)
                    .on("mouseleave", mouseleave)
                // Remove and Draw the center rect 
                svgRadial.selectAll("rect")
                    .remove();
                svgRadial.append("rect")
                    .attr("x", center.x)
                    .attr("y", center.y)
                    .attr("width", 10)
                    .attr("height", 10)
                    .attr("class", "location-center")
                    .style("fill", "black");
                showClosestBar(closestBar)
            }

            // Function to get location when button is clicked
            function getLocation() {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(getLocationCallback, showError);
                } else {
                    permissionElement.innerHTML = "Geolocation is not supported by this browser.";
                }
            }

            function getLocationCallback(position) {
                const { coords } = position;
                const { latitude, longitude } = coords;
                updateLatitude(latitude);
                updateLongitude(longitude);
                showLatitude(latitude);
                showLongitude(longitude);
                paintRadialPlot();
            }

            function updateLatitude(latitude) {
                currentLocation = {
                    ...currentLocation,
                    lat: parseFloat(latitude),
                }
                showLatitude(latitude);
                paintRadialPlot();
            }

            function updateLongitude(longitude) {
                currentLocation = {
                    ...currentLocation,
                    long: parseFloat(longitude),
                }
                showLongitude(longitude);
                paintRadialPlot();
            }

            // Sets up locations inputs
            {
                locationElement.addEventListener("click", getLocation);
                latitudeElement.addEventListener("change", ({ target }) => updateLatitude(target.value));
                longitudeElement.addEventListener("change", ({ target }) => updateLongitude(target.value));
            }

            updateAll();
        });
    });
})();