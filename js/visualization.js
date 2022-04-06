// time chart vizualization give the user information when a particular bar
// they selected is opens
(function () {

    // things todo:
      // implement a tooltip when hovering over a day to get open and close time
      // find a way to display openings that lead into the next morning (open overnight)
      // delete items that are tagged as possibly unecessary
      // use 'selected' bar once selection is implemented
      
    d3.csv('https://raw.githubusercontent.com/DS4200-S22/final-project-bar-hopper/main/data/final_hours_data.csv').then(data => {
      // change this later when interactivity is added
      // using just the first line of data for now because this chart relies on a selection to be made
      // which hasnt yet been implemented (writing at the time of pm-07).
      // the format this was developed in makes for easy refactoring when a bar will be selected
      // in the finished product
      const currentlyUsing = data[0];

      // will need to be adjusted later to account for places open overnight
      // for right now just cap it at midnight
      const convertToValidTimeString = (input) => {
        let toReturn 
        toReturn = input.substring(0, 2)
        return toReturn + ':' + input.substring(2,4) + ':00'
      };

      // creates date object out of formatted time
      const dataFormatter = d3.timeParse('%H:%M:%S');

      // the actual date is irrelivent, only intiallized because d3 works better with date()
      // obects, will only display times and the day string
      const barHours = [
        { 
          day: 'Mon', 
          open: dataFormatter(convertToValidTimeString(currentlyUsing.mon_start)), 
          close: dataFormatter(convertToValidTimeString(currentlyUsing.mon_end))
        },
        { 
          day: 'Tues', 
          open: dataFormatter(convertToValidTimeString(currentlyUsing.tues_start)), 
          close: dataFormatter(convertToValidTimeString(currentlyUsing.tues_end))
        },
        { 
          day: 'Wed', 
          open: dataFormatter(convertToValidTimeString(currentlyUsing.wed_start)), 
          close: dataFormatter(convertToValidTimeString(currentlyUsing.wed_end))
        },
        { 
          day: 'Thurs', 
          open: dataFormatter(convertToValidTimeString(currentlyUsing.thurs_start)), 
          close: dataFormatter(convertToValidTimeString(currentlyUsing.thurs_end))
        },
        { 
          day: 'Fri', 
          open: dataFormatter(convertToValidTimeString(currentlyUsing.fri_start)), 
          close: dataFormatter(convertToValidTimeString(currentlyUsing.fri_end))
        },
        { 
          day: 'Sat', 
          open: dataFormatter(convertToValidTimeString(currentlyUsing.sat_start)), 
          close: dataFormatter(convertToValidTimeString(currentlyUsing.sat_end))
        },
        { 
          day: 'Sun', 
          open: dataFormatter(convertToValidTimeString(currentlyUsing.sun_start)), 
          close: dataFormatter(convertToValidTimeString(currentlyUsing.sun_end))
        }
      ];

      // set up date range axis
      // delete if still unecessary after next pm
      let firstDay = d3.timeDay.floor(new Date(barHours[0].open));
      let lastDay = d3.timeDay.ceil(new Date(barHours[barHours.length - 1].close));
      let dateRange = [d3.min(barHours, function (d) { return d3.timeDay.floor(new Date(d.open)) }),
      d3.max(barHours, function (d) { return d3.timeDay.ceil(new Date(d.close)) })];

      // intital margin and dimension setup
      const width = 900;
      const height = 450;
      const margin = { left: 50, right: 50, bottom: 50, top: 50 };

      // set up d3 time formatting
      // delete if still unecessary after next pm
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
      const createTimeGraph = (data) => {
        let xScale = d3.scaleTime()
            .domain([0, 24])
            .range([0, width]);

        // delete if no longer using after next pm
        let yScale = d3.scaleTime()
            .domain(dateRange)
            .range([0, height]);

        // use days for y axis rather than dates
        let yScaleDays = d3.scaleBand()
          .domain(data.map(function (d) { return d.day }))
          .range([0, height])

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
        // svg.append("g")
        //     .call(d3.axisLeft(yScale)
        //         .scale(yScale)
        //         .tickFormat((interval, i) => {
        //             return i % 2 !== 0 ? " " : yAxisFormatter(interval);
        //         }));

        // y axis new
        // uses days instead of dates
        svg.append("g")
              .call(d3.axisLeft(yScaleDays))

        // create actual bar graphs
        svg.append("g")
            .selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "time-bar")
            .attr("x", function (d) {
                let h = hourFormatter(new Date(d.open)).split(":"), // changes datum from string, to proper Date Object, back to hour string and splits
                    xh = parseFloat(h[0]) + parseFloat(h[1] / 60); // time (hour and minute) as decimal
                return xScale(xh);
                ;
            })
            //.attr("y", function (d) { return yScale(d3.timeDay.floor(new Date(d.open))) })
            .attr("y", function (d) { return yScaleDays(d.day) })
            .attr("width", function (d) {
                let hstart = new Date(d.open),
                    hstop = new Date(d.close);
                return xScale((hstop - hstart) / 3600000);	// divide to convert to hours
            })
            .attr("height", 30)
            .attr("rx", 10)
            .attr("ry", 10)
    };

      // call function to create the graph and display
      createTimeGraph(barHours);
    });

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