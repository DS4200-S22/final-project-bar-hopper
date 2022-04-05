// dummy data representing the hours that a bar is open
(function() {
    const barHours = [
        { open: "2022-03-28 10:00:00", close: "2022-03-28 20:00:00" },
        { open: "2022-03-29 6:00:00", close: "2022-03-29 15:00:00" },
        { open: "2022-03-30 10:00:00", close: "2022-03-30 20:00:00" },
        { open: "2022-03-31 12:00:00", close: "2022-03-31 22:00:00" },
        { open: "2022-04-01 16:00:00", close: "2022-04-01 17:00:00" },
        { open: "2022-04-02 15:00:00", close: "2022-04-02 21:00:00" },
        { open: "2022-04-03 08:00:00", close: "2022-04-03 16:00:00" }
    ];

    // set up date range axis
    let firstDay = d3.timeDay.floor(new Date(barHours[0].open));
    let lastDay = d3.timeDay.ceil(new Date(barHours[barHours.length - 1].close));
    let dateRange = [d3.min(barHours, function(d) { return d3.timeDay.floor(new Date(d.open)) }),
        d3.max(barHours, function(d) { return d3.timeDay.ceil(new Date(d.close)) })
    ];

    // intital margin and dimension setup
    const width = 900;
    const height = 450;
    const margin = { left: 50, right: 50, bottom: 50, top: 50 };

    // set up d3 time formatting
    const dayFormatter = d3.timeFormat("%w");
    const weekFormatter = d3.timeFormat("%U");
    const hourFormatter = d3.timeFormat("%X");
    const yAxisFormatter = d3.timeFormat("%m/%d");

    // begin creating svg
    const svg = d3.select("#vis-timechart")
        .append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    // function that handles creating the graph based on data given
    // done this way for easy transition when using read in data rather than static dummy data using right now
    const createTimeGraph = (data) => {
        let xScale = d3.scaleTime()
            .domain([0, 24])
            .range([0, width]);

        let yScale = d3.scaleTime()
            .domain(dateRange)
            .range([0, height]);

        let fullScale = d3.scaleTime()
            .domain([d3.timeHour(new Date(2014, 0, 1, 0, 0, 0)),
                d3.timeHour(new Date(2014, 0, 2, 0, 0, 0)),
            ])
            .range([0, width]);

        // x axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale)
                .scale(fullScale)
                .tickFormat(d3.timeFormat("%H:%M")));

        // y axis
        svg.append("g")
            .call(d3.axisLeft(yScale)
                .scale(yScale)
                .tickFormat((interval, i) => {
                    return i % 2 !== 0 ? " " : yAxisFormatter(interval);
                }));

        // create actual bar graphs
        svg.append("g")
            .selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "time-bar")
            .attr("x", function(d) {
                let h = hourFormatter(new Date(d.open)).split(":"), //changes datum from string, to proper Date Object, back to hour string and splits
                    xh = parseFloat(h[0]) + parseFloat(h[1] / 60); //time (hour and minute) as decimal
                return xScale(xh);;
            })
            .attr("y", function(d) { return yScale(d3.timeDay.floor(new Date(d.open))) })
            .attr("width", function(d) {
                let hstart = new Date(d.open),
                    hstop = new Date(d.close);
                return xScale((hstop - hstart) / 3600000); //date operations return a timestamp in miliseconds, divide to convert to hours
            })
            .attr("height", 30)
            .attr("rx", 10)
            .attr("ry", 10)
    };

    // call function to create the graph and display
    createTimeGraph(barHours);

    // references:
    // utilized time packages, installed with npm including:
    //  d3-time
    //  d3-time-format
    // utilized tutorials and documentation to aid in the creation of these visualizations including:
    //  https://bl.ocks.org/d3noob/e600fd7ebc4c2a5ed57374a9ff95ac23
    //  http://bl.ocks.org/LauraHornbake/6248343
    //  https://d3-graph-gallery.com/graph/barplot_horizontal.html
    //  https://observablehq.com/@d3/d3-scaletime

})();