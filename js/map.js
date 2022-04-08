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

    d3.json("https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/boston.geojson").then(function(data) {

        // Load external data and boot
        d3.csv("https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/final_main_data.csv").then(function(main_data) {

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
                // console.log("over")

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
            svg
                .selectAll("myCircles")
                .data(main_data)
                .join("circle")
                .attr("class", d => "p" + d.price.length + " r" + d.rating * 10) // price class
                // .attr("rating", d => d.rating) // rating class
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
                    window.location = d.url;
                    // console.log(d.url)
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

})();