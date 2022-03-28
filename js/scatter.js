// Set margins and dimensions 
const margin = { top: 50, right: 50, bottom: 50, left: 200 };
const width = 900 - margin.left - margin.right;
const height = 650 - margin.top - margin.bottom;

// Append svg object to the body of the page to house Scatterplot1
const svg = d3.select("#scatter-holder")
    .append("svg")
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("viewBox", [0, 0, width, height]);

d3.csv('../data/hours_data.csv').then(data => {
    function getHours(id) {
        hours = data.filter(function(id) {
            return data['id'] == id;
        })
    }
})

d3.csv('../data/main_data.csv').then(data => {
    const data = data.slice(0, 10);

    // Setting up x-axis
    const xKey = 'Review Rating';
    const xMax = d3.max(data, d => {
        return d['rating']
    });
    const xScale = d3.scaleLinear()
        .domain([0, xMax])
        .range([margin.left, width - margin.right]);
    svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale))
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
    const yMax = d3.max(data, (d) => {
        return d['review_count']
    });
    const yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([height - margin.bottom, margin.top])
    svg.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale))
        .attr('font-size', '20px')
        .call(g => g.append('text')
            .attr('x', 0)
            .attr('y', margin.top)
            .attr('fill', 'black')
            .attr('text-anchor', 'end')
            .text(yKey)
        );

});