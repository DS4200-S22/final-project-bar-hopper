// set width and height of svg
(function() {
    const width = 800
    const height = 600

    // The svg
    const svg = d3.select("#vis_map")
        .append("svg")
        .attr("width", width)
        .attr("height", height)

    let g = svg.append("g");

    // Data point for time chart
    let currentlyUsing;

    // // Create data for circles:
    // const markers = [{
    //         // Northeastern
    //         long: -71.0892,
    //         lat: 42.3398,
    //         name: "Northeastern University"
    //     },
    //     {
    //         // Boston Common
    //         long: -71.0668,
    //         lat: 42.3552,
    //         name: "Boston Common"
    //     }
    // ];


    d3.json("https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/boston.geojson").then(function(data) {

        // Load external data and boot
        d3.csv("https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/final_main_data.csv").then(function(main_data) {

            // Set initial point for time chart data

            // Map and projection
            const projection = d3.geoMercator()
                .fitSize([800, 600], data); // Fit data to map size

            // Filter data
            // data.features = data.features.filter(d => d.properties.name == "France")

            d3.selectAll(".price").on("change", update);
            d3.selectAll(".rating").on("change", update);
            update()

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
            myCircles = svg
                .selectAll("myCircles")
                .data(main_data)
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
                    window.location = d.url;
                    // Pass data to time chart
                });

            let zoom = d3.zoom()
                .scaleExtent([0.5, 16])
                .on('zoom', updateChart);

            svg.call(zoom);

            // A function that updates the chart when the user zoom and thus new boundaries are available
            function updateChart(event) {

                g.selectAll('path')
                    .attr('transform', event.transform);

                svg.selectAll("circle")
                    .attr('transform', event.transform)
                    .attr('r', 6 / event.transform.k) // Scale down zoom of circles
                    .attr('stroke-width', 2 / event.transform.k); // Scale down zoom of circles
            }

            function update() {
                // Get checkbox data
                d3.selectAll(".price").each(function(d) {
                    cb = d3.select(this);
                    price_level = "p" + cb.property("value")
                        // If the box is checked, I show the group
                    if (cb.property("checked")) {
                        svg.selectAll("." + price_level).style("opacity", 1)

                        // Otherwise I hide it
                    } else {
                        svg.selectAll("." + price_level).style("opacity", 0)
                    }
                });

                // Get checkbox data
                d3.selectAll(".rating").each(function(d) {
                    cb = d3.select(this);
                    rating = "r" + cb.property("value") * 10
                        //         // If the box is checked, I show the group
                    if (cb.property("checked")) {
                        svg.selectAll("." + rating).style("opacity", 1)
                    }
                });
            }
        });
    });

    d3.csv('https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/final_hours_data.csv').then(data => {
        // change this later when interactivity is added
        // using just the first line of data for now because this chart relies on a selection to be made
        // which hasnt yet been implemented (writing at the time of pm-07).
        // the format this was developed in makes for easy refactoring when a bar will be selected
        // in the finished product
        currentlyUsing = data[0];

        // will need to be adjusted later to account for places open overnight
        // for right now just cap it at midnight
        const convertToValidTimeString = (input) => {
            let toReturn
            toReturn = input.substring(0, 2)
            return toReturn + ':' + input.substring(2, 4) + ':00'
        };

        // creates date object out of formatted time
        const dataFormatter = d3.timeParse('%H:%M:%S');

        // the actual date is irrelivent, only intiallized because d3 works better with date()
        // obects, will only display times and the day string
        const barHours = [{
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

        // set up date range axis
        // delete if still unecessary after next pm
        let firstDay = d3.timeDay.floor(new Date(barHours[0].open));
        let lastDay = d3.timeDay.ceil(new Date(barHours[barHours.length - 1].close));
        let dateRange = [d3.min(barHours, function(d) { return d3.timeDay.floor(new Date(d.open)) }),
            d3.max(barHours, function(d) { return d3.timeDay.ceil(new Date(d.close)) })
        ];

        // intital margin and dimension setup
        const width = 900;
        const height = 450;
        const margin = { left: 50, right: 50, bottom: 50, top: 50 };

        // set up d3 time formatting
        // delete if still unecessary after next pm
        const dayFormatter = d3.timeFormat("%w");
        const weekFormatter = d3.timeFormat("%U");
        const hourFormatter = d3.timeFormat("%X");
        const yAxisFormatter = d3.timeFormat("%m/%d");

        // begin creating svg
        const svg = d3.select("#vis-timechart")
            .append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

        // function that handles creating the graph based on data given
        const createTimeGraph = (data) => {
            let xScale = d3.scaleTime()
                .domain([0, 24])
                .range([0, width]);

            // delete if no longer using after next pm
            let yScale = d3.scaleTime()
                .domain(dateRange)
                .range([0, height]);

            // use days for y axis rather than dates
            let yScaleDays = d3.scaleBand()
                .domain(data.map(function(d) { return d.day }))
                .range([0, height])

            let fullScale = d3.scaleTime()
                .domain([d3.timeHour(new Date(2014, 0, 1, 0, 0, 0)),
                    d3.timeHour(new Date(2014, 0, 2, 0, 0, 0)),
                ])
                .range([0, width]);

            // x axis
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(xScale)
                    .scale(fullScale)
                    .tickFormat(d3.timeFormat("%H:%M")));

            // y axis
            // svg.append("g")
            //     .call(d3.axisLeft(yScale)
            //         .scale(yScale)
            //         .tickFormat((interval, i) => {
            //             return i % 2 !== 0 ? " " : yAxisFormatter(interval);
            //         }));

            // y axis new
            // uses days instead of dates
            svg.append("g")
                .call(d3.axisLeft(yScaleDays))

            // create actual bar graphs
            svg.append("g")
                .selectAll("rect")
                .data(data)
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
                .attr("ry", 10)
        };

        // call function to create the graph and display
        createTimeGraph(barHours);
    });

})();