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

(function () {
    d3.json("https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/boston.geojson").then(function (map_data) {
        // Load external data and boot
        d3.csv("https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/final_merged_data.csv").then(function (merged_data) {
            (function () {
                // Map Dimension and Projection
                const width_map = 450;
                const height_map = 450;
                const projection_map = d3.geoMercator()
                    .fitSize([width_map, height_map], map_data)

                // Svg Map
                let svg_map;
                let circles_map;

                {
                    const tagId_map = "#vis-map";
                    svg_map = d3.select(tagId_map)
                        .append("svg")
                        .attr("width", width_map)
                        .attr("height", height_map);
                }


                let g_map = svg_map.append("g");



                d3.selectAll(".price").on("change", filter_bars);
                d3.selectAll(".rating").on("change", filter_bars);
                filter_bars()

                // Draw the map
                g_map.selectAll("path")
                    .data(map_data.features)
                    .join("path")
                    .attr("fill", "#b8b8b8")
                    .attr("d", d3.geoPath()
                        .projection(projection_map)
                    )
                    .style("stroke", "black")
                    .style("opacity", .3)

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
                    .attr("cx", d => {
                        console.log(projection_map([d.longitude, d.latitude])[0]);
                        return projection_map([d.longitude, d.latitude])[0];
                    })
                    .attr("cy", d => projection_map([d.longitude, d.latitude])[1])
                    .attr("r", 6)
                    // .style("fill", "#0000ff")
                    .style('fill', d => color[d['price']] || 'black')
                    .style("opacity", 0)
                    .attr("stroke", "#000000")
                    .attr("stroke-width", 2)
                    .attr("fill-opacity", .4);

                function filter_bars() {
                    // Get checkbox data
                    d3.selectAll(".price").each(function (d) {
                        console.log('HERE');
                        cb = d3.select(this);
                        price_level = "p" + cb.property("value")
                        // If the box is checked, I show the group
                        if (cb.property("checked")) {
                            svg_map.selectAll("." + price_level).style("opacity", 1)
                            console.log(svg_map.selectAll("." + price_level));
                            // Otherwise I hide it
                        } else {
                            svg_map.selectAll("." + price_level).style("opacity", 0)
                        }
                    });

                    // Get checkbox data
                    d3.selectAll(".rating").each(function (d) {
                        cb = d3.select(this);
                        rating = "r" + cb.property("value") * 10
                        //         // If the box is checked, I show the group
                        if (cb.property("checked")) {
                            svg_map.selectAll("." + rating).style("opacity", 1)
                            console.log(svg_map.selectAll("." + rating));
                        }
                    });
                }
            })();
        });
    });

})();