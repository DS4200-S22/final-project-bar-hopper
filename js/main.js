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

//Finds dots within the brushed region
function isBrushed(x0, x1, y0, y1, cx, cy) {
    return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1; // This return TRUE or FALSE depending on if the points is in the selected area
}

(function () {
    d3.json("https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/boston.geojson").then(function (mapData) {
        d3.csv("https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/final_merged_data.csv").then(function (mergedData) {

            // Map Dimension and Projection
            const widthMap = 500;
            const heightMap = 500;
            const projection_map = d3.geoMercator()
                .fitSize([widthMap, heightMap], mapData)

            // Scatter Dimension and Margin
            const widthScatter = 400;
            const heightScatter = 350;
            const margin_scatter = { top: 25, right: 25, bottom: 15, left: 15 };
            const innerWidthScatter = widthScatter - margin_scatter.left - margin_scatter.right;
            const innerHeightScatter = heightScatter - margin_scatter.top - margin_scatter.bottom;
            const k = heightScatter / widthScatter;

            // Svg Map
            let svg_map;
            let circles_map;
            let brushMap;
            let brushXMap;
            let brushYMap;

            // Svg Scatter
            let gDot;
            // let svgScatter;
            // let circlesScatter;
            // let xAxisScatter;
            // let yAxisScatter;
            // let zoomScatter;
            let xScaleScatter;
            let yScaleScatter;

            // Sets up channels
            const color = {
                "$": "#eb4034",
                "$$": "#1c03fc",
                "$$$": "#6eeb34",
                "$$$$": "#34ebdc",
            }

            // Sets up filter check boxs
            const rating_choices = new Set();
            const price_choices = new Set();
            function updateRatingChoices({ checked, value }) {
                console.log(checked, value);
                if (checked) rating_choices.add(value);
                else rating_choices.delete(value);
            }
            function updatePriceChoices({ checked, value }) {
                console.log(checked, value);
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

            // Sets up tool tip for the visulzation
            const tooltip = d3.select("#tooltip")
                .append("div")
                .style("opacity", 0)
                .attr("class", "tooltip")
                .style("border", "solid")
                .style("border-width", "1px")
                .style("border-radius", "5px")
                .style("padding", "10px")
            const mouseover = function () {
                tooltip.style("opacity", 1)
            }
            let mousemove = function (event, d) {
                tooltip.html("This establishment is: " + d.name + "<br> Price: " + d.price + "<br> Rating: " + d.rating + "<br> Review Counts:" + d["review_count"])
                    .style("left", (event.pageX + 10) + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
                    .style("top", (event.pageY - 45) + "px")
            }
            const mouseleave = function () {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0)
            }

            // Sets Up Main map
            {
                // Sets up the initial svg
                const tagId_map = "#vis-map";
                svg_map = d3.select(tagId_map)
                    .append("svg")
                    .attr("width", widthMap)
                    .attr("height", heightMap);
                let g_map = svg_map.append("g");

                // Draw the map
                g_map.selectAll("path")
                    .data(mapData.features)
                    .join("path")
                    .attr("fill", "#b8b8b8")
                    .attr("d", d3.geoPath()
                        .projection(projection_map)
                    )
                    .style("stroke", "black")
                    .style("opacity", .3)

                // Sets up brush
                long1 = projection_map.invert([0, 0])[0];
                long2 = projection_map.invert([widthMap, 0])[0];
                lat1 = projection_map.invert([0, 0])[1];
                lat2 = projection_map.invert([0, heightMap])[1];
                brushXMap = d3.scaleLinear()
                    .range([0, widthMap])
                    .domain([long1, long2])
                brushYMap = d3.scaleLinear()
                    .range([0, heightMap])
                    .domain([lat1, lat2])
                brushMap = d3.brush()
                    .extent([[0, 0], [widthMap, heightMap]])
                    .on("start", brushClear)
                    .on("brush", brushUpdate);
                svg_map.call(brushMap);
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


                // Sets up channels
                const color = {
                    '$': '#eb4034',
                    '$$': '#1c03fc',
                    '$$$': '#6eeb34',
                    '$$$$': '#34ebdc',
                }

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

                svg.call(zoom).call(zoom.transform, d3.zoomIdentity)
            }

            // Sets up brush functions
            function brushClear() {
                svg_map.call(brushMap.move, null);
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
                    svg_map.selectAll("circle")
                        .classed("selected", (d) => {
                            if (isBrushed(x0, x1, y0, y1, brushXMap(parseFloat(d["longitude"])), brushYMap(parseFloat(d["latitude"])))) {
                                brushed.push(d);
                                return true;
                            }
                            return false;
                        })
                    brushed = brushed.length > 0 ? brushed : mergedData;
                    paintScatterPlot(brushed);
                }
            }


            // Redraw Map, Scatter, Radial
            function updateAll() {
                // Filters the data
                if (price_choices.size > 0) newData = mergedData.filter((d, i) => price_choices.has(d["price"]));
                if (rating_choices.size > 0) newData = mergedData.filter((d, i) => rating_choices.has(d["rating"]));
                newData = price_choices.size + rating_choices.size > 0 ? newData : mergedData;

                // Paints the map
                circles_map = svg_map.selectAll("circle")
                    .data(newData, d => d["id"]);;
                circles_map.enter()
                    .append("circle")
                    .attr("class", d => "p" + d.price.length + " r" + d.rating * 10) // price and rating classes
                    .attr("id", (d) => d.id) // unique id
                    .attr("cx", d => projection_map([d.longitude, d.latitude])[0])
                    .attr("cy", d => projection_map([d.longitude, d.latitude])[1])
                    .attr("r", 6)
                    .style('fill', d => color[d["price"]] || "black")
                    .attr("stroke", "#000000")
                    // .attr("stroke-width", 2)
                    // .attr("fill-opacity", .4)
                    .on("mouseover", mouseover)
                    .on("mousemove", mousemove)
                    .on("mouseleave", mouseleave);
                circles_map.exit()
                    .remove();

                paintScatterPlot(newData);
            }

            function paintScatterPlot(data) {
                console.log(data);
                circles_Scatter = gDot.selectAll("path")
                    .data(data, d => d["id"]);;
                circles_Scatter.enter()
                    .append("path")
                    .attr("d", d => `M${xScaleScatter(d['rating'] || 0)},${yScaleScatter(d['review_count'] || 0)}h0`)
                    .attr("stroke", d => color[d['price']] || 'black')
                    // .attr("opacity", .4)
                    .attr('r', 8)
                    .on("mouseover", mouseover)
                    .on("mousemove", mousemove)
                    .on("mouseleave", mouseleave)
                circles_Scatter.exit()
                    .remove();
            }
            updateAll();
        });
    });
})();