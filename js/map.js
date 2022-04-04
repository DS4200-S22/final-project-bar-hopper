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

    // Create data for circles:
    const markers = [{
            // Northeastern
            long: -71.0892,
            lat: 42.3398,
            name: "Northeastern University"
        },
        {
            // Boston Common
            long: -71.0668,
            lat: 42.3552,
            name: "Boston Common"
        }
    ];

    d3.csv("https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/final_main_data.csv").then(function(main_data) {

        // Load external data and boot
        d3.json("https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/boston.geojson").then(function(data) {

            // Print data to console
            console.log(data);

            // Map and projection
            const projection = d3.geoMercator()
                .fitSize([800, 600], data); // Fit data to map size

            // Filter data
            // data.features = data.features.filter(d => d.properties.name == "France")
            let price_category = "$$";
            let price_categories = ["$", "$$$$"];
            // main_data = main_data.filter(d => d.price == price_category)
            main_data = main_data.filter(d => price_categories.includes(d.price))

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
                tooltip
                    .style("opacity", 1)
            }

            var mousemove = function(event, d) {
                // console.log("move")
                tooltip
                    .html("This establishment is: " + d.name + "<br> Price: " + d.price + "<br> Rating: " + d.rating + "<br>")
                    .style("left", event.pageX + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
                    .style("top", event.pageY + "px")
            }

            // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
            var mouseleave = function(event, d) {
                // console.log("leave")
                tooltip
                    .transition()
                    .duration(200)
                    .style("opacity", 0)
            }

            // Add circles:
            svg
                .selectAll("myCircles")
                .data(main_data)
                .join("circle")
                .attr("cx", d => projection([d.longitude, d.latitude])[0])
                .attr("cy", d => projection([d.longitude, d.latitude])[1])
                .attr("r", 6)
                .style("fill", "69b3a2")
                // .attr("stroke", "#69b3a2")
                // .attr("stroke-width", 3)
                .attr("fill-opacity", .4)
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)
        });

        var zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', updateChart);
        // .on('zoom', function(event) {
        //     g.selectAll('path')
        //         .attr('transform', event.transform);
        //     svg.selectAll("circle")
        //         .attr('transform', event.transform);
        // });

        svg.call(zoom);


        // A function that updates the chart when the user zoom and thus new boundaries are available
        function updateChart(event) {

            g.selectAll('path')
                .attr('transform', event.transform);

            svg.selectAll("circle")
                .attr('transform', event.transform)
                .attr('r', 6 / event.transform.k);
            console.log(event.transform.k)
        }
    });
})();