// set width and height of svg
(function() {
    const width = 800
    const height = 600

    // The svg
    const svg = d3.select("#vis-radar")
        .append("svg")
        .attr("width", width)
        .attr("height", height)

    let g = svg.append("g");

    const user = {
        // User
        long: -71.0678,
        lat: 42.3522,
        name: "User"}

    // Create data for circles:
    // const markers = [
    //         [{
    //         // User
    //         long: -71.0678,
    //         lat: 42.3552,
    //         name: "User"},
    //         {
    //         // Northeastern
    //         long: -71.0892,
    //         lat: 42.3398,
    //         name: "Northeastern University"},
    //         ],
    //         [
    //             {
    //             // User
    //             long: -71.0678,
    //             lat: 42.3552,
    //             name: "User"},
    //             {
    //         // Boston Common
    //         long: -71.0668,
    //         lat: 42.3552,
    //         name: "Boston Common"
    //     }]
    // ]


    d3.json("https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/boston.geojson").then(function(data) {

        // Load external data and boot
        d3.csv("https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/final_main_data.csv").then(function(main_data) {
            var presets = {
                zoom: 20,
                userSize: 10,
                rangeSize: 100
            }


            var albersProjection = d3.geoAlbers()
                .scale(190000*presets.zoom)
                .rotate([71.057, 42.313-user.lat])
                .center([user.long+71.057, 42.313])
                .translate([width/2, height/2]);
            // Filter data
            // data.features = data.features.filter(d => d.properties.name == "France")

            // Draw the map
            g.selectAll("path")
                .data(data.features)
                .join("path")
                .attr("fill", "#b8b8b8")
                .attr("d", d3.geoPath()
                    .projection(albersProjection)
                )
                .style("stroke", "black")
                .style("opacity", .3)

            // Add a tooltip div. Here I define the general feature of the tooltip: stuff that do not depend on the data point.
            // Its opacity is set to 0: we don't see it by default.
            const tooltip = d3.select("#vis-radar")
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
                .attr("id", 'bar')
                .attr("class", d => "p" + d.price.length) // price class
                .attr("cx", d => albersProjection([d.longitude, d.latitude])[0])
                .attr("cy", d => albersProjection([d.longitude, d.latitude])[1])
                .attr("r", 6)
                .style("fill", "#0000ff")
                // .style("fill", "69b3a2")
                .style("opacity", 1)
                .attr("stroke", "#000000")
                .attr("stroke-width", 2)
                .attr("fill-opacity", .4)
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave);


            var zoom = d3.zoom()
                .scaleExtent([0.5, 16])
                .on('zoom', updateChart);

            svg.call(zoom);


            // A function that updates the chart when the user zoom and thus new boundaries are available
            function updateChart(event) {

                g.selectAll('path')
                    .attr('transform', event.transform);

                svg.selectAll("#bar")
                    .attr('transform', event.transform)
                    .attr('r', 6 / event.transform.k) // Scale down zoom of circles
                    .attr('stroke-width', 2 / event.transform.k); // Scale down zoom of circles
                
                svg.selectAll('#user')
                    .attr('transform', event.transform)
                    .attr('r', presets.userSize / event.transform.k) // Scale down zoom of circles
                    .attr('stroke-width', 2 / event.transform.k); // Scale down zoom of circles
                
                svg.selectAll('#range')
                    .attr('transform', event.transform)
                    // .attr('r', presets.rangeSize / event.transform.k) // Scale down zoom of circles
                    .attr('stroke-width', 2 / event.transform.k); // Scale down zoom of circles
            }
            

            // add markers
            svg.append("circle")
            .attr("id", "user")
            // .attr("cx", albersProjection([user.long, user.lat]))
            // .attr("cy", albersProjection([user.long, user.lat]))
            .attr("cx", albersProjection([user.long, user.lat])[0])
            .attr("cy", albersProjection([user.long, user.lat])[1])
            .attr("r", presets.userSize)
            .style("fill", "red")
            .style("opacity", 1)
            .attr("stroke", "#8c0315")
            .attr("stroke-width", 2)
            .attr("fill-opacity", .4);

            
            // add markers
            svg.append("circle")
            .attr("id", "range")
            // .attr("cx", albersProjection([user.long, user.lat]))
            // .attr("cy", albersProjection([user.long, user.lat]))
            .attr("cx", albersProjection([user.long, user.lat])[0])
            .attr("cy", albersProjection([user.long, user.lat])[1])
            .attr("r", 100)
            .style("fill", "lightgreen")
            .style("opacity", 1)
            .attr("stroke", "#0b9e35")
            .attr("stroke-width", 2)
            .attr("fill-opacity", .4);



            // make lines between points

            // var thisData = {
            //     x1: -71.0678,
            //     y1: 42.3552,
            //     x2: -71.0892,
            //     y2: 42.3398
            //   };
            // var link = svg.selectAll(".link")
            //     .data(thisData.links)
            //     .enter().append("line")
            //     .attr("class", "link")
            //     .style('stroke','green')
            //     .style("stroke-width", 5000000);
            
            // link.attr("x1", function(d) { console.log(d); return d.x1; })
            //     .attr("y1", function(d) { return d.y1; })
            //     .attr("x2", function(d) { return d.x2; })
            //     .attr("x2", function(d) { return d.x2; });
        });
    });
})();
