// set width and height of svg
(function () {
    const width = 800
    const height = 600

    // The svg
    const svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width)
        .attr("height", height)

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

    // d3.csv("../data/final_main_data.csv").then(function(data) {
    //     // console.log(data)
    //     data.forEach(element => {
    //         // console.log(element)
    //         console.log("Longitude: " + element.longitude + ", Latitude: " + element.latitude)
    //     });
    // })

    d3.csv("../data/final_main_data.csv").then(function (main_data) {

        // Load external data and boot
        d3.json("../data/boston.geojson").then(function (data) {

            // Map and projection
            const projection = d3.geoMercator()
                .fitSize([800, 600], data); // Fit data to map size

            // Filter data
            // data.features = data.features.filter(d => d.properties.name == "France")

            // Draw the map
            svg.append("g")
                .selectAll("path")
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
            const tooltip = d3.select("#my_dataviz")
                .append("div")
                .style("opacity", 0)
                .attr("class", "tooltip")
                .style("background-color", "white")
                .style("border", "solid")
                .style("border-width", "1px")
                .style("border-radius", "5px")
                .style("padding", "10px")

            // A function that change this tooltip when the user hover a point.
            // Its opacity is set to 1: we can now see it. Plus it set the text and position of tooltip depending on the datapoint (d)
            const mouseover = function (event, d) {
                // console.log("over")
                tooltip
                    .style("opacity", 1)
            }

            var mousemove = function (event, d) {
                // console.log("move")
                tooltip
                    .html("This esatblishment is: " + d.name + "<br> Price: " + d.price + "<br> Rating: " + d.rating + "<br>")
                    // .style("left", (event.x) / 2 + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
                    // .style("top", (event.y) / 2 + "px")
                    .style("left", event.x + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
                    .style("top", event.y + "px")
            }

            // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
            var mouseleave = function (event, d) {
                // console.log("leave")
                tooltip
                    .transition()
                    .duration(200)
                    .style("opacity", 0)
            }

            // // Add circles:
            // svg
            //     .selectAll("myCircles")
            //     .data(markers)
            //     .join("circle")
            //     .attr("cx", d => projection([d.long, d.lat])[0])
            //     .attr("cy", d => projection([d.long, d.lat])[1])
            //     .attr("r", 6)
            //     .style("fill", "69b3a2")
            //     .attr("stroke", "#69b3a2")
            //     .attr("stroke-width", 3)
            //     .attr("fill-opacity", .4)
            //     .on("mouseover", mouseover)
            //     .on("mousemove", mousemove)
            //     .on("mouseleave", mouseleave)

            // console.log(markers)

            // Add circles:
            svg
                .selectAll("myCircles")
                .data(main_data)
                .join("circle")
                .attr("cx", d => projection([d.longitude, d.latitude])[0])
                .attr("cy", d => projection([d.longitude, d.latitude])[1])
                .attr("r", 6)
                .style("fill", "69b3a2")
                .attr("stroke", "#69b3a2")
                .attr("stroke-width", 3)
                .attr("fill-opacity", .4)
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)
        });

        // console.log(data)
        // main_data.forEach(element => {
        //     // console.log(element)
        //     console.log("Longitude: " + element.longitude + ", Latitude: " + element.latitude)
        // });
    })
})();