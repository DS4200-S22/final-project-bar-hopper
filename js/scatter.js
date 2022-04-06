(function() {
    // Reference: https://observablehq.com/@d3/zoomable-scatterplot
    const margin = { top: 25, right: 25, bottom: 15, left: 15 };
    const width = 600;
    const height = 800;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const k = height / width;

    // Append svg object to the body of the page to house Scatterplot1
    const tagId = '#vis-scatter';
    const svg = d3.select(tagId)
        .append("svg")
        .attr("width", innerWidth) // Sets the width of the svg
        .attr("height", innerHeight) // Sets the height of the svg
        .attr("viewBox", [0, 0, width, height]); // Sets the viewbox of the svg

    const gx = svg.append('g');

    const gy = svg.append('g');

    const gGrid = svg.append('g');

    const gDot = svg.append('g')
        .attr('fill', 'none')
        .attr('stroke-linecap', 'round');

    d3.csv('https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/final_main_data.csv').then(data => {
        // Setting up x-axis
        const xTick = 11;
        const xKey = 'Review Rating';
        let xMax = d3.max(data, d => {
            return parseInt(d['rating'])
        });
        let xMin = d3.min(data, d => {
            return parseInt(d['rating'])
        });
        console.log(xMin)
        const xScale = d3.scaleLinear()
            .domain([xMin - 0.5, xMax])
            .range([margin.left, width - margin.right]);
        xAxis = (g, x) => g
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisTop(x).ticks(xTick))
            .call(g => g.select(".domain").attr("display", "none"));
        gx.call(g => g.append("text")
            .attr('x', width - margin.right)
            .attr('y', margin.bottom + 5)
            .attr('font-size', '15px')
            .attr('fill', 'black')
            .attr('text-anchor', 'end')
            .text(xKey)
        );

        // Setting up y-axis
        const yKey = 'Review Count';
        const yMax = d3.max(data, d => {
            return parseInt(d['review_count'])
        });
        const yScale = d3.scaleLinear()
            .domain([-100, yMax * 1.05])
            .range([height - margin.bottom, margin.top]);
        yAxis = (g, y) => g
            .attr('transform', `translate(${margin.left}, 0)`)
            .call(d3.axisRight(y).ticks(xTick * k))
            .call(g => g.select(".domain").attr("display", "none"));
        gy.call(g => g.append('text')
            .attr('x', margin.left + yKey.length * 6)
            .attr('y', margin.top - 5)
            .attr('font-size', '15px')
            .attr('fill', 'black')
            .attr('text-anchor', 'end')
            .text(yKey)
        );

        // Setting up channels
        const color = {
            '$': '#eb4034',
            '$$': '#1c03fc',
            '$$$': '#6eeb34',
            '$$$$': '#34ebdc',
        }

        // Setting up tooltip
        const tooltip = d3.select(tagId)
            .append('div')
            .style('opacity', 0)
            .attr('class', 'tooltip')
        const mouseover = function(d) {
            tooltip.style('opacity', 1);
        }
        const mousemove = function(event, d) {
            tooltip
                .html(`Review Count: ${d['review_count' || 'unknown']}, Review Rating: ${d['rating'] || 'unknown'}, Price: ${d['price'] || 'unknown'}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 45) + "px")
        }
        let mouseleave = function(d) {
            tooltip
                .transition()
                .duration(300)
                .style("opacity", 0)
        }

        // Setting up dots
        gDot.selectAll("path")
            .data(data)
            .join("path")
            .attr("d", d => `M${xScale(d['rating'] || 0)},${yScale(d['review_count'] || 0)}h0`)
            .attr("stroke", d => color[d['price']] || 'black')
            .attr('r', 8)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);

        // Setting up zoom
        const zoom = d3.zoom()
            .scaleExtent([0.5, 30])
            .on("zoom", zoomed);

        function zoomed({ transform }) {
            const zx = transform.rescaleX(xScale).interpolate(d3.interpolateRound);
            const zy = transform.rescaleY(yScale).interpolate(d3.interpolateRound);
            gDot.attr("transform", transform).attr("stroke-width", 8 / transform.k);
            gx.call(xAxis, zx);
            gy.call(yAxis, zy);
            gGrid.call(grid, zx, zy);
        }

        // Setting up grid
        const grid = (g, x, y) => g
            .attr("stroke", "currentColor")
            .attr("stroke-opacity", 0.1)
            .call(g => g
                .selectAll(".x")
                .data(x.ticks(xTick))
                .join(
                    enter => enter.append("line").attr("class", "x").attr("y2", height),
                    update => update,
                    exit => exit.remove()
                )
                .attr("x1", d => 0.5 + x(d))
                .attr("x2", d => 0.5 + x(d)))
            .call(g => g
                .selectAll(".y")
                .data(y.ticks(xTick * k))
                .join(
                    enter => enter.append("line").attr("class", "y").attr("x2", width),
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
    });
})();