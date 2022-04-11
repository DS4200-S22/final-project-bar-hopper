(function() {
    // Map
    const width_map = 450;
    const height_map = 450;

    // Set the initial svg
    const tagId_map = "#vis-map";
    let svg_map = d3.select(tagId_map)
        .append("svg")
        .attr("width", width_map)
        .attr("height", height_map);

    let g = svg_map.append("g");


    // Radial
    const width_radial = 300;
    const height_radial = 300;

    // Set the initial svg
    const tagId_radial = "#vis-radial";
    let svg_radial = d3.select(tagId_radial)
        .append("svg")
        .attr("width", width_radial) // Sets the width of the svg
        .attr("height", height_radial) // Sets the height of the svg
        .attr("viewBox", [0, 0, width_radial, height_radial]); // Sets the viewbox of the svg

    const center = {
        x: width_radial / 2,
        y: height_radial / 2,
    };

    function distance(location1, location2) {
        const R = 6371e3;
        const lat1 = location1.lat * Math.PI / 180; // lat1, lat2 in radians
        const lat2 = location2.lat * Math.PI / 180;
        const latDiff = (location2.lat - location1.lat) * Math.PI / 180;
        const logDiff = (location2.log - location1.log) * Math.PI / 180;

        const a = Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(logDiff / 2) * Math.sin(logDiff / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function bearing(location1, location2) {
        const lat1 = location1.lat * Math.PI / 180; // lat1, lat2, log1, log2 in radians
        const lat2 = location2.lat * Math.PI / 180;
        const log1 = location1.log * Math.PI / 180;
        const log2 = location2.log * Math.PI / 180;
        const y = Math.sin(log2 - log1) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(log2 - log1);
        const θ = Math.atan2(y, x);
        const brng = (θ * 180 / Math.PI + 360) % 360; // in degrees
        return brng;
    }


    // Time

    // Intital margin and dimension setup
    const width_time = 300;
    const height_time = 300;
    const margin = { left: 50, right: 50, bottom: 50, top: 50 };

    // set up d3 time formatting
    // delete if still unecessary after next pm
    const dayFormatter = d3.timeFormat("%w");
    const weekFormatter = d3.timeFormat("%U");
    const hourFormatter = d3.timeFormat("%X");
    const yAxisFormatter = d3.timeFormat("%m/%d");

    // Set the initial svg
    const tagId_time = "#vis-timechart";
    let svg_time = d3.select(tagId_time)
        .append("svg")
        .attr("width", width_time + margin.right + margin.left)
        .attr("height", height_time + margin.top + margin.bottom)
        .append("g")
        .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');


    // High level variables to reference in linking visualizations
    // Currently selected bar
    let currentlyUsing;
    // Bar hours of operation data
    let barHours;


    d3.json("https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/boston.geojson").then(function(data) {

        // Load external data and boot
        d3.csv("https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/final_merged_data.csv").then(function(merged_data) {

            // Set initial bar to the first record
            currentlyUsing = merged_data[0];
            console.log(currentlyUsing)

            // function that handles creating the graph based on data given
            function createTimeGraph() {
                // Delete old time chart and replace with new
                d3.select("#vis-timechart").selectAll("svg").remove();

                svg_time = d3.select("#vis-timechart")
                    .append("svg")
                    .attr("width", width_time + margin.right + margin.left)
                    .attr("height", height_time + margin.top + margin.bottom)
                    .append("g")
                    .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

                const convertToValidTimeString = (input) => {
                    let toReturn;
                    toReturn = input.substring(0, 2);
                    return toReturn + ':' + input.substring(2, 4) + ':00';
                };

                // creates date object out of formatted time
                const dataFormatter = d3.timeParse('%H:%M:%S');

                // the actual date is irrelivent, only intiallized because d3 works better with date()
                // obects, will only display times and the day string
                barHours = [{
                        day: 'Mon',
                        open: dataFormatter(convertToValidTimeString(currentlyUsing.mon_start)),
                        close: dataFormatter(convertToValidTimeString(currentlyUsing.mon_end))
                    },
                    {
                        day: 'Tues',
                        open: dataFormatter(convertToValidTimeString(currentlyUsing.tues_start)),
                        close: dataFormatter(convertToValidTimeString(currentlyUsing.tues_end))
                    },
                    {
                        day: 'Wed',
                        open: dataFormatter(convertToValidTimeString(currentlyUsing.wed_start)),
                        close: dataFormatter(convertToValidTimeString(currentlyUsing.wed_end))
                    },
                    {
                        day: 'Thurs',
                        open: dataFormatter(convertToValidTimeString(currentlyUsing.thurs_start)),
                        close: dataFormatter(convertToValidTimeString(currentlyUsing.thurs_end))
                    },
                    {
                        day: 'Fri',
                        open: dataFormatter(convertToValidTimeString(currentlyUsing.fri_start)),
                        close: dataFormatter(convertToValidTimeString(currentlyUsing.fri_end))
                    },
                    {
                        day: 'Sat',
                        open: dataFormatter(convertToValidTimeString(currentlyUsing.sat_start)),
                        close: dataFormatter(convertToValidTimeString(currentlyUsing.sat_end))
                    },
                    {
                        day: 'Sun',
                        open: dataFormatter(convertToValidTimeString(currentlyUsing.sun_start)),
                        close: dataFormatter(convertToValidTimeString(currentlyUsing.sun_end))
                    }
                ];

                console.log(barHours)

                // set up date range axis
                // delete if still unecessary after next pm
                let firstDay = d3.timeDay.floor(new Date(barHours[0].open));
                let lastDay = d3.timeDay.ceil(new Date(barHours[barHours.length - 1].close));
                let dateRange = [d3.min(barHours, function(d) { return d3.timeDay.floor(new Date(d.open)) }),
                    d3.max(barHours, function(d) { return d3.timeDay.ceil(new Date(d.close)) })
                ];

                let xScale = d3.scaleTime()
                    .domain([0, 24])
                    .range([0, width_time]);

                // delete if no longer using after next pm
                let yScale = d3.scaleTime()
                    .domain(dateRange)
                    .range([0, height_time]);

                // use days for y axis rather than dates
                let yScaleDays = d3.scaleBand()
                    .domain(barHours.map(function(d) { return d.day }))
                    .range([0, height_time])

                let fullScale = d3.scaleTime()
                    .domain([d3.timeHour(new Date(2014, 0, 1, 0, 0, 0)),
                        d3.timeHour(new Date(2014, 0, 2, 0, 0, 0)),
                    ])
                    .range([0, width_time]);

                // x axis
                svg_time.append("g")
                    .attr("transform", "translate(0," + height_time + ")")
                    .call(d3.axisBottom(xScale)
                        .scale(fullScale)
                        .tickFormat(d3.timeFormat("%H:%M")));

                // y axis new
                // uses days instead of dates
                svg_time.append("g")
                    .call(d3.axisLeft(yScaleDays))

                // create actual bar graphs
                svg_time.append("g")
                    .selectAll("rect")
                    .data(barHours)
                    .enter()
                    .append("rect")
                    .attr("class", "time-bar")
                    .attr("x", function(d) {
                        let h = hourFormatter(new Date(d.open)).split(":"), // changes datum from string, to proper Date Object, back to hour string and splits
                            xh = parseFloat(h[0]) + parseFloat(h[1] / 60); // time (hour and minute) as decimal
                        return xScale(xh);;
                    })
                    //.attr("y", function (d) { return yScale(d3.timeDay.floor(new Date(d.open))) })
                    .attr("y", function(d) { return yScaleDays(d.day) })
                    .attr("width", function(d) {
                        let hstart = new Date(d.open),
                            hstop = new Date(d.close);
                        return xScale((hstop - hstart) / 3600000); // divide to convert to hours
                    })
                    .attr("height", 30)
                    .attr("rx", 10)
                    .attr("ry", 10);

                // Delete previous data and add bar name
                d3.select("#bar-name").select("h1").remove();
                d3.select("#bar-name")
                    .append("h1")
                    .text(currentlyUsing.name);

                // Delete previous data and add Yelp link
                d3.select("#yelp-link").select("a").remove();
                d3.select("#yelp-link")
                    .append("a")
                    .attr("href", currentlyUsing.url)
                    .html("Yelp Page");
            };

            function createRadialGraph() {
                // Delete old radial graph and replace with new
                d3.select(tagId_radial).selectAll("svg").remove()

                svg_radial = d3.select(tagId_radial)
                    .append("svg")
                    .attr("width", width_radial) // Sets the width of the svg
                    .attr("height", height_radial) // Sets the height of the svg
                    .attr("viewBox", [0, 0, width_radial, height_radial]); // Sets the viewbox of the svg

                // Parse the current selected bar's location data
                let currentlyUsingLocation = {
                    lat: currentlyUsing.latitude,
                    log: currentlyUsing.longitude
                }

                const path = d3.path();
                const maxDist = d3.max(merged_data, d => {
                    return distance(currentlyUsingLocation, { lat: d['latitude'], log: d['longitude'] })
                })
                merged_data.forEach(d => {
                    path.moveTo(center.x, center.y);
                    const barLocation = {
                        lat: d['latitude'],
                        log: d['longitude'],
                    };
                    const dist = distance(currentlyUsingLocation, barLocation) / maxDist;
                    const bear = bearing(currentlyUsingLocation, barLocation);
                    const x = dist * center.x * Math.cos(bear) + center.x;
                    const y = dist * center.y * Math.sin(bear) + center.y;
                    path.lineTo(x, y);
                    svg_radial
                        .append('circle')
                        .attr('cx', x)
                        .attr('cy', y)
                        .attr('r', 2)
                        .style('fill', 'blue')
                });

                svg_radial
                    .append('path')
                    .attr('stroke', 'black')
                    .attr('opacity', 0.3)
                    .attr('d', path);

                svg_radial
                    .append('circle')
                    .attr('cx', center.x)
                    .attr('cy', center.y)
                    .attr('r', 5)
                    .style('fill', 'orange');
            };

            // Create graphs on initial load for the default first record
            createTimeGraph();
            createRadialGraph();


            // Map and projection
            const projection = d3.geoMercator()
                .fitSize([800, 600], data); // Fit data to map size

            // Filter data
            // data.features = data.features.filter(d => d.properties.name == "France")

            d3.selectAll(".price").on("change", filter_bars);
            d3.selectAll(".rating").on("change", filter_bars);
            filter_bars()

            // Draw the map
            g.selectAll("path")
                .data(data.features)
                .join("path")
                .attr("fill", "#b8b8b8")
                .attr("d", d3.geoPath()
                    .projection(projection)
                )
                .style("stroke", "black")
                .style("opacity", .3)

            // Add a tooltip div. Here I define the general feature of the tooltip: stuff that do not depend on the data point.
            // Its opacity is set to 0: we don't see it by default.
            const tooltip = d3.select("#vis_map")
                .append("div")
                .style("opacity", 0)
                .attr("class", "tooltip")
                // .style("background-color", "white")
                .style("border", "solid")
                .style("border-width", "1px")
                .style("border-radius", "5px")
                .style("padding", "10px")

            // A function that change this tooltip when the user hover a point.
            // Its opacity is set to 1: we can now see it. Plus it set the text and position of tooltip depending on the datapoint (d)
            const mouseover = function(event, d) {
                // console.log("over", event.target, this)

                // If the current point is visible, show tooltip
                if (d3.select(this).style("opacity") != 0) {
                    tooltip
                        .style("opacity", 1)
                }
            }

            let mousemove = function(event, d) {
                // console.log("move")
                tooltip
                    .html("This establishment is: " + d.name + "<br> Price: " + d.price + "<br> Rating: " + d.rating + "<br>")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 45) + "px")
            }

            // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
            let mouseleave = function(event, d) {
                // console.log("leave")
                tooltip
                    .transition()
                    .duration(200)
                    .style("opacity", 0)
            }

            // Setting up channels
            const color = {
                '$': '#eb4034',
                '$$': '#1c03fc',
                '$$$': '#6eeb34',
                '$$$$': '#34ebdc',
            }

            // Add circles:
            myCircles = svg_map
                .selectAll("myCircles")
                .data(merged_data)
                .join("circle")
                .attr("class", d => "p" + d.price.length + " r" + d.rating * 10) // price and rating classes
                .attr("id", (d) => d.id) // unique id
                .attr("cx", d => projection([d.longitude, d.latitude])[0])
                .attr("cy", d => projection([d.longitude, d.latitude])[1])
                .attr("r", 6)
                // .style("fill", "#0000ff")
                .style('fill', d => color[d['price']] || 'black')
                .style("opacity", 0)
                .attr("stroke", "#000000")
                .attr("stroke-width", 2)
                .attr("fill-opacity", .4)
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)
                .on("click", function(event, d) {
                    // Redirect to bar's yelp page
                    // window.location = d.url;
                    // Pass data to other charts
                    currentlyUsing = d;
                    console.log(currentlyUsing);
                    createTimeGraph();
                    createRadialGraph();
                });

            // Zoom functionality for map
            let zoom = d3.zoom()
                .scaleExtent([0.5, 16])
                .on('zoom', updateMapZoom);

            svg_map.call(zoom);


            // A function that updates the chart when the user zoom and thus new boundaries are available
            function updateMapZoom(event) {

                g.selectAll('path')
                    .attr('transform', event.transform);

                svg_map.selectAll("circle")
                    .attr('transform', event.transform)
                    .attr('r', 6 / event.transform.k) // Scale down zoom of circles
                    .attr('stroke-width', 2 / event.transform.k); // Scale down zoom of circles
            }

            function filter_bars() {
                // Get checkbox data
                d3.selectAll(".price").each(function(d) {
                    cb = d3.select(this);
                    price_level = "p" + cb.property("value")
                        // If the box is checked, I show the group
                    if (cb.property("checked")) {
                        svg_map.selectAll("." + price_level).style("opacity", 1)

                        // Otherwise I hide it
                    } else {
                        svg_map.selectAll("." + price_level).style("opacity", 0)
                    }
                });

                // Get checkbox data
                d3.selectAll(".rating").each(function(d) {
                    cb = d3.select(this);
                    rating = "r" + cb.property("value") * 10
                        //         // If the box is checked, I show the group
                    if (cb.property("checked")) {
                        svg_map.selectAll("." + rating).style("opacity", 1)
                    }
                });
            }
        });
    });

})();