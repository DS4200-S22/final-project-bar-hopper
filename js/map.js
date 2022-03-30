// The svg
// const svg = d3.select("svg"),
//     width = +svg.attr("width"),
//     height = +svg.attr("height");
const svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", 800)
    .attr("height", 600)



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

// Load external data and boot
d3.json("../data/boston.geojson").then(function(data) {

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
    const mouseover = function(event, d) {
        tooltip
            .style("opacity", 1)
    }

    const mousemove = function(event, d) {
        tooltip
            .html("This is " + d.name + "<br> Long: " + d.long + "<br> Lat: " + d.lat + "<br>")
            .style("left", (event.x) / 2 + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
            .style("top", (event.y) / 2 + "px")
    }

    // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
    const mouseleave = function(event, d) {
        tooltip
            .transition()
            .duration(200)
            .style("opacity", 0)
    }

    // Add circles:
    svg
        .selectAll("myCircles")
        .data(markers)
        .join("circle")
        .attr("cx", d => projection([d.long, d.lat])[0])
        .attr("cy", d => projection([d.long, d.lat])[1])
        .attr("r", 6)
        .style("fill", "69b3a2")
        .attr("stroke", "#69b3a2")
        .attr("stroke-width", 3)
        .attr("fill-opacity", .4)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)

    console.log(markers)

    // add event listeners

    // // on mouseover event, call mouseover function
    // svg.selectAll("circle")
    //     .on("mouseover", mouseover)
    //     // .on("mouseout", mouseout)
    //     .on("mousemove", mousemove)
    //     .on("mouseleave", mouseleave)
});

// /* 

//   Tooltip Set-up  

// */

// // TODO: What does each line of this code do? 
// // Adds a div to the hard-coded-bar div with attriute id: tooltip2 and class tooltip
// const tooltip = d3.select("#my_dataviz")
//     .append("div")
//     .attr('id', "tooltip")
//     .style("opacity", 0)
//     .attr("class", "tooltip");

// // TODO: What does each line of this code do?
// // Creates the mouseover function
// const mouseover = function(event, d) {
//     console.log(d.long)
//     tooltip.html("Long: " + d.long + "<br> Lat: " + d.lat + "<br>")
//         .style("opacity", 1);
// }


// const mouseout = function(event, d) {
//     console.log(d.lat)
//     tooltip.style("opacity", 0);
// }

// // TODO: What does each line of this code do? 
// // Creates the mousemove function
// const mousemove = function(event, d) {
//     console.log('moving')
//     tooltip.style("left", (event.x) + "px")
//         .style("top", (event.pageY) + "px");
//     // .style("top", (event.pageY + yTooltipOffset) + "px");
// }