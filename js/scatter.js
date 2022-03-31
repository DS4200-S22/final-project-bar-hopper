// Set margins and dimensions 
(function() {
    const margin = { top: 50, right: 50, bottom: 50, left: 200 };
    const width = 1500;
    const height = 1000;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Append svg object to the body of the page to house Scatterplot1
    const tagId = '#vis-scatter';
    const svg = d3.select(tagId)
        .append("svg")
        .attr("width", innerWidth) // Sets the width of the svg
        .attr("height", innerHeight) // Sets the height of the svg
        .attr("viewBox", [0, 0, width, height]); // Sets the viewbox of the svg

    d3.csv('https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/final_main_data.csv').then(data => {
        // Setting up x-axis
        const xKey = 'Review Rating';
        const xMax = d3.max(data, d => {
            return parseInt(d['rating'])
        });
        let xMin = d3.min(data, d => {
            return parseInt(d['rating'])
        });
        xMin = xMin > 0 ? 0 : xMin;
        const xScale = d3.scaleLinear()
            .domain([xMin, xMax * 1.05])
            .range([margin.left, width - margin.right]);
        const xAxis = svg.append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(xScale).tickSize(-innerHeight))
            .attr('font-size', '20px')
            .call(g => g.append("text")
                .attr('x', width - margin.right)
                .attr('y', margin.bottom - 4)
                .attr('fill', 'black')
                .attr('text-anchor', 'end')
                .text(xKey)
            );

        // Setting up y-axis
        const yKey = 'Review Count';
        const yMax = d3.max(data, d => {
            return parseInt(d['review_count'])
        });
        const yMin = d3.min(data, d => {
            return parseInt(d['review_count'])
        });
        const yScale = d3.scaleLinear()
            .domain([yMin, yMax * 1.05])
            .range([height - margin.bottom, margin.top]);
        const yAxis = svg.append('g')
            .attr('transform', `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(yScale).tickSize(-innerWidth))
            .attr('font-size', '20px')
            .call(g => g.append('text')
                .attr('x', margin.left / 3)
                .attr('y', margin.top - 5)
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

        var mouseleave = function(d) {
            tooltip
                .transition()
                .duration(300)
                .style("opacity", 0)
        }

        // Plot the dots
        svg.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('id', d => d['id'])
            .attr('cx', d => xScale(parseInt(d['rating'])))
            .attr('cy', d => yScale(parseInt(d['review_count'])))
            .attr('r', 8)
            .attr('fill', d => color[d['price']] || 'black')
            .attr('opacity', 0.5)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);

        // Setting up zoom
        const zoom = d3.zoom()
            .scaleExtent([0, 30]) // This control how much you can unzoom (x0.5) and zoom (x20)
            .extent([
                [0, 0],
                [width, height]
            ])
            .on("zoom", updateChart);

        // A function that updates the chart when the user zoom and thus new boundaries are available
        function updateChart({ transform }) {
            // recover the new scale
            var newX = transform.rescaleX(xScale);
            var newY = transform.rescaleY(yScale);

            // update axes with these new boundaries
            xAxis.call(d3.axisBottom(newX).tickSize(-innerHeight))
            yAxis.call(d3.axisLeft(newY).tickSize(-innerWidth))

            // update circle position
            svg
                .selectAll("circle")
                .attr('cx', function(d) { return newX(parseInt(d['rating'])) })
                .attr('cy', function(d) { return newY(parseInt(d['review_count'])) });
        }

        svg.call(zoom)
            // Reference Links
            // http://bl.ocks.org/peterssonjonas/4a0e7cb8d23231243e0e
    });
})();